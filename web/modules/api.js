export class API {
    constructor(settings) {
        this.settings = settings;
    }

    updateSettings(newSettings) {
        this.settings = newSettings;
    }

    createAuthHeader(username, password) {
        return 'Basic ' + btoa(username + ':' + password);
    }

    createRequestHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.settings.username && this.settings.password) {
            headers['Authorization'] = this.createAuthHeader(this.settings.username, this.settings.password);
        }
        return headers;
    }

    async getQueueStatus() {
        const response = await fetch(`${this.settings.origin}queue`, {
            headers: this.createRequestHeaders()
        });
        return await response.json();
    }

    async getHistory(maxItemCount = 64) {
        const response = await fetch(`${this.settings.origin}api/history?max_items=${maxItemCount}`, {
            headers: this.createRequestHeaders()
        });
        return await response.json();
    }

    async postPrompt(prompt) {
        const response = await fetch(`${this.settings.origin}api/prompt`, {
            method: 'POST',
            headers: this.createRequestHeaders(),
            body: JSON.stringify({ prompt })
        });
        return await response.json();
    }
} 