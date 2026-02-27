const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // If unauthorized or forbidden, try to refresh token
    if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            console.log('Access token expired, attempting refresh...');
            const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                // Retry original request with new token
                return fetch(`${API_URL}${endpoint}`, {
                    ...options,
                    headers: {
                        ...headers,
                        'Authorization': `Bearer ${data.accessToken}`,
                    },
                });
            } else {
                // Refresh failed, logout
                console.error('Refresh token invalid or expired, logging out...');
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/auth';
            }
        }
    }

    return response;
}
