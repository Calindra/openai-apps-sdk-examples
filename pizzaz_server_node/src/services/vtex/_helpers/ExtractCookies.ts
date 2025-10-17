interface ExtractCookiesResponse {
  headers: {
    'set-cookie'?: string[];
    [key: string]: any; // Allow other headers
  };
}

export default function ExtractCookies(response: ExtractCookiesResponse, cookieName: string): string | null {
	// Return null if no response, headers, or cookie name
	if (!response || !response.headers || !cookieName) {
		return null;
	}

	const setCookieHeader = response.headers['set-cookie'];

	if (setCookieHeader) {
		const regex = new RegExp(`${cookieName}=(.*?)(?:;|
)`, 'i'); // Updated regex to handle end of string or semicolon
		for (const cookieString of setCookieHeader) {
			const match = cookieString.match(regex);
			if (match && match[1]) {
				return match[1];
			}
		}
	}

	return null;
}
