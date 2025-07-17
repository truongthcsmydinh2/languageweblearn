document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('analyses-container');
    chrome.storage.local.get({ savedAnalyses: [] }, (result) => {
        const analyses = result.savedAnalyses;
        if (analyses.length === 0) {
            container.innerHTML = '<p>Chưa có gì được lưu.</p>';
            return;
        }
        container.innerHTML = '';
        analyses.forEach(item => {
            const card = document.createElement('div');
            card.className = 'analysis-card';
            let formsHTML = 'N/A';
            if(item.forms && item.forms.length > 0) {
                formsHTML = item.forms.map(f => `${f.type}: ${f.word}`).join(', ');
            }
            card.innerHTML = `
                <h2>${item.word}</h2>
                <p><strong>Cấp độ:</strong> ${item.cefr_level}</p>
                <p><strong>Phiên âm:</strong> <span class="ipa-text">${item.ipa}</span></p>
                <p><strong>Nghĩa:</strong> ${item.meaning_vi}</p>
                <p><strong>Dạng từ:</strong> ${formsHTML}</p>
            `;
            container.appendChild(card);
        });
    });
}); 