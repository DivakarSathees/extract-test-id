document.getElementById('extractForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('statusMessage');
    const submitBtn = document.getElementById('submitBtn');
    const loader = document.querySelector('.loader');
    const btnText = document.querySelector('.btn-text');

    // Reset UI
    statusMsg.textContent = '';
    statusMsg.style.color = 'var(--text-color)';
    submitBtn.disabled = true;
    loader.classList.remove('hidden');
    btnText.textContent = 'Processing...';

    const formData = new FormData(e.target);

    try {
        const response = await fetch('/visit', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorMsg = 'Something went wrong';
            try {
                const err = await response.json();
                errorMsg = err.error || errorMsg;
            } catch (e) {
                // If response is not JSON (maybe HTML error page)
                errorMsg = `Server returned ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }

        // Handle File Download
        const blob = await response.blob();
        if (blob.size === 0) {
            throw new Error("Received empty file from server.");
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Extractions_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        statusMsg.textContent = 'Extraction successful! Download started.';
        statusMsg.style.color = 'var(--success-color)';

    } catch (error) {
        statusMsg.textContent = `Error: ${error.message}`;
        statusMsg.style.color = 'var(--error-color)';
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        loader.classList.add('hidden');
        btnText.textContent = 'Extract Data';
    }
});

// File input change handler for better UX
const fileInput = document.getElementById('file');
const fileText = document.querySelector('.file-text');

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileText.textContent = e.target.files[0].name;
    } else {
        fileText.textContent = 'Choose Excel File';
    }
});
