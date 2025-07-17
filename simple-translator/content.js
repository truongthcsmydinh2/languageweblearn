let translatorIcon = null;
let selectedText = '';

// --- Các hàm xử lý icon và lựa chọn văn bản (giữ nguyên) ---
document.addEventListener('mouseup', (event) => {
    const popup = document.getElementById('translation-popup');
    if (popup && popup.contains(event.target)) return;
    setTimeout(() => {
        const selection = window.getSelection();
        const currentSelectedText = selection.toString().trim();
        if (currentSelectedText && currentSelectedText !== selectedText) {
            selectedText = currentSelectedText;
            removeTranslationPopup();
            if (!translatorIcon) createIcon();
            const range = selection.getRangeAt(0);
            positionIcon(range.getBoundingClientRect(), event.pageX, event.pageY);
        } else if (!currentSelectedText) {
            removeIcon();
        }
    }, 10);
});
document.addEventListener('mousedown', (event) => {
    if (translatorIcon && !translatorIcon.contains(event.target)) removeIcon();
    const popup = document.getElementById('translation-popup');
    if (popup && !popup.contains(event.target)) removeTranslationPopup();
});
function createIcon() {
    removeIcon();
    translatorIcon = document.createElement('img');
    translatorIcon.id = 'translator-icon';
    translatorIcon.src = chrome.runtime.getURL('images/translate-icon.png');
    translatorIcon.addEventListener('mousedown', (event) => {
        event.stopPropagation();
        chrome.runtime.sendMessage({ action: "translate", text: selectedText });
    });
    document.body.appendChild(translatorIcon);
}
function positionIcon(rect, pageX, pageY) {
    if (translatorIcon) {
        translatorIcon.style.left = `${pageX + 5}px`;
        translatorIcon.style.top = `${pageY - 35}px`;
    }
}
function removeIcon() {
    if (translatorIcon) {
        translatorIcon.remove();
        translatorIcon = null;
    }
}

// --- THAY ĐỔI LỚN BẮT ĐẦU TỪ ĐÂY ---

// 1. Lắng nghe kết quả dịch (giờ sẽ nhận cả từ gốc và nghĩa)
chrome.runtime.onMessage.addListener((request) => {
    switch(request.action) {
        case "displayTranslation":
            showTranslationPopup(request.original, request.translation);
            removeIcon();
            break;
        case "displayAIResponse":
            updatePopupWithAIResponse(request);
            break;
    }
});

// 2. Cập nhật hàm hiển thị popup để có thêm nút "Lưu"
function showTranslationPopup(original, translation) {
    removeTranslationPopup();
    const popup = document.createElement('div');
    popup.id = 'translation-popup';

    popup.innerHTML = `
        <div id="popup-header">Dịch & Phân tích</div>
        <div id="popup-content">
            <span class="original-word">${original}</span>
            <span class="translation-text">${translation}</span>
            <button id="save-vocab-btn">Lưu vào từ điển</button>
            <button id="ask-ai-btn">Hỏi AI phân tích</button>
            <div id="ai-response-area"></div>
        </div>
    `;
    document.body.appendChild(popup);

    const lastSelection = window.getSelection().getRangeAt(0).getBoundingClientRect();
    popup.style.left = `${lastSelection.left + window.scrollX}px`;
    popup.style.top = `${lastSelection.bottom + window.scrollY + 5}px`;

    // Sự kiện cho nút Lưu
    const saveButton = document.getElementById('save-vocab-btn');
    saveButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            action: 'save',
            vocab: original,
            meaning: translation
        });
        saveButton.textContent = 'Đã lưu! ✅';
        saveButton.disabled = true;
    });

    // NÚT MỚI: Hỏi AI
    const askAIButton = document.getElementById('ask-ai-btn');
    askAIButton.addEventListener('click', () => {
        const responseArea = document.getElementById('ai-response-area');
        responseArea.innerHTML = `<div class="loading-text">Đang hỏi AI, vui lòng chờ...</div>`;
        askAIButton.disabled = true;
        chrome.runtime.sendMessage({
            action: 'askAI',
            text: original
        });
    });

    // Logic kéo thả và chống biến mất (giữ nguyên)
    const header = document.getElementById('popup-header');
    let isDragging = false, offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;
        popup.style.opacity = '0.8';
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            popup.style.left = `${e.clientX - offsetX}px`;
            popup.style.top = `${e.clientY - offsetY}px`;
        }
    });
    document.addEventListener('mouseup', () => { isDragging = false; popup.style.opacity = '1'; });
    popup.addEventListener('mousedown', (e) => { e.stopPropagation(); });
}

function removeTranslationPopup() {
    const popup = document.getElementById('translation-popup');
    if (popup) popup.remove();
}

// HÀM MỚI: Hiển thị kết quả từ AI
function updatePopupWithAIResponse(response) {
    const responseArea = document.getElementById('ai-response-area');
    const askAIButton = document.getElementById('ask-ai-btn');
    if (!responseArea) return;
    if (response.error) {
        responseArea.innerHTML = `<div class="response-item" style="color: red;"><strong>Lỗi:</strong> ${response.error}</div>`;
    } else {
        const data = response.data;
        let formsHTML = '';
        if (data.forms && data.forms.length > 0) {
            formsHTML = data.forms.map(form => `<li><strong>${form.type}:</strong> ${form.word}</li>`).join('');
            formsHTML = `<ul>${formsHTML}</ul>`;
        }
        // THÊM ICON LƯU VÀ ICON LOA VÀO HTML
        responseArea.innerHTML = `
            <div class="response-item"><strong>Cấp độ (CEFR):</strong> <span class="cefr-level">${data.cefr_level || 'N/A'}</span></div>
            <div class="response-item"><strong>Phiên âm (IPA):</strong> <span class="ipa-text">${data.ipa || 'N/A'}</span><span class="speaker-icon" data-word="${response.data?.originalWord || ''}" title="Nghe phát âm">🔊</span></div>
            <div class="response-item"><strong>Nghĩa:</strong> ${data.meaning_vi || 'N/A'}</div>
            <div class="response-item"><strong>Các dạng từ:</strong> ${formsHTML || 'N/A'}</div>
            <div class="response-item actions"><span class="save-analysis-icon" title="Lưu phân tích này">💾</span></div>
        `;
        // SỰ KIỆN PHÁT ÂM
        const speakerIcon = responseArea.querySelector('.speaker-icon');
        if (speakerIcon) {
            speakerIcon.addEventListener('click', () => {
                playPronunciation(speakerIcon.dataset.word);
            });
        }
        // SỰ KIỆN LƯU PHÂN TÍCH
        const saveIcon = responseArea.querySelector('.save-analysis-icon');
        if (saveIcon) {
            saveIcon.addEventListener('click', () => {
                chrome.runtime.sendMessage({
                    action: "saveAnalysis",
                    analysisData: {
                        word: response.data?.originalWord || '',
                        ...data
                    }
                });
                saveIcon.textContent = '✅';
                saveIcon.style.cursor = 'default';
                saveIcon.title = 'Đã lưu';
            });
        }
    }
    if (askAIButton) {
        askAIButton.disabled = false;
    }
}
// HÀM MỚI: DÙNG API CỦA TRÌNH DUYỆT ĐỂ PHÁT ÂM
function playPronunciation(word) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ phát âm.");
    }
}