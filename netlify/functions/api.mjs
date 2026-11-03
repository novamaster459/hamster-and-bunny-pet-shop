const blockedHeaders = [
    "connection",
    "content-encoding",
    "content-length",
    "host",
    "keep-alive",
    "transfer-encoding",
];

export default async (request, context) => {
    const apiOrigin = process.env.SHOP_API_URL;
    if (!apiOrigin) {
        return Response.json(
            { error: "The shop API is not configured. Set SHOP_API_URL in Netlify." },
            { status: 503 },
        );
    }

    const requestUrl = new URL(request.url);
    const functionPath = "/.netlify/functions/api/";
    const pathFromUrl = requestUrl.pathname.startsWith(functionPath)
        ? requestUrl.pathname.slice(functionPath.length)
        : requestUrl.pathname.replace(/^\/api\/?/, "");
    const apiPath = context.params?.splat || pathFromUrl;
    let targetUrl;
    try {
        const configuredOrigin = new URL(apiOrigin);
        const isLocalHttp = ["localhost", "127.0.0.1"].includes(configuredOrigin.hostname);
        if (configuredOrigin.protocol !== "https:" &&
            !(configuredOrigin.protocol === "http:" && isLocalHttp)) {
            throw new Error("SHOP_API_URL must use HTTPS.");
        }
        const netlifySiteUrl = context.site?.url
            ? new URL(context.site.url)
            : null;
        if (
            configuredOrigin.host === requestUrl.host ||
            (netlifySiteUrl && configuredOrigin.host === netlifySiteUrl.host)
        ) {
            return Response.json(
                {
                    error: "SHOP_API_URL points to this Netlify site and creates a proxy loop. Set it to the separate HTTPS URL of your Flask backend, then redeploy.",
                },
                { status: 503 },
            );
        }
        targetUrl = new URL(`/api/${apiPath}${requestUrl.search}`, configuredOrigin.origin);
    } catch (error) {
        console.error("SHOP_API_URL must be a valid HTTPS server origin:", error);
        return Response.json(
            { error: "SHOP_API_URL must be set to the HTTPS origin of the Flask server." },
            { status: 500 },
        );
    }
    const headers = new Headers(request.headers);
    for (const header of blockedHeaders) {
        headers.delete(header);
    }

    const options = {
        method: request.method,
        headers,
        redirect: "manual",
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
        options.body = await request.arrayBuffer();
    }

    try {
        const upstream = await fetch(targetUrl, options);
        const responseHeaders = new Headers(upstream.headers);
        for (const header of blockedHeaders) {
            responseHeaders.delete(header);
        }
        return new Response(upstream.body, {
            status: upstream.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error("Could not reach the configured Flask shop API:", error);
        return Response.json(
            { error: "The shop server could not be reached. Check SHOP_API_URL and server health." },
            { status: 502 },
        );
    }
};
