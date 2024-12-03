async function generateResponse(prompt) {
    const url = "http://localhost:11434/api/generate";
    const data = {
        model: "llama3.1",
        prompt: prompt,
        stream: false
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const jsonResponse = await response.json();
            return jsonResponse.response || 'No response found';
        } else {
            return `Failed with status code: ${response.status}`;
        }
    } catch (error) {
        return `Request failed: ${error.message}`;
    }
}

