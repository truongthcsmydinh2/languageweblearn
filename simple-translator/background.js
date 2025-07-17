// DÁN API KEY CỦA BẠN VÀO ĐÂY
const GOOGLE_API_KEY = "AIzaSyCaG7k28BDGEx5T2vqbam8We58zV60W0eg";
const GEMINI_API_KEY = "AIzaSyAccPNc9POAFlkgFEJyaWeESIRkasAEMFw"; // <-- KEY MỚI
// ĐỊA CHỈ API CỦA GOOGLE TRANSLATE
// LƯU Ý: ĐỊA CHỈ NÀY CÓ THỂ
const GOOGLE_TRANSLATE_URL = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;


// THÔNG TIN API CÁ NHÂN CỦA BẠN
const MY_API_ENDPOINT = "http://amnhactechcf.ddns.net:3030/api/vocab";

const FIREBASE_UID = "Ts4UVBbnwwN5cdSPSgwgThsoWT12"; // <-- UID CỦA BẠN
// --- KẾT THÚC CÁC THÔNG SỐ CẦN THIẾT ---

// === BỘ NÃO XỬ LÝ SỰ KIỆN ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "translate":
            handleTranslate(request, sender);
            break;
        case "save":
            handleSave(request);
            break;
        case "askAI":
            handleAskAI(request, sender);
            break;
        // CASE MỚI: LƯU PHÂN TÍCH AI
        case "saveAnalysis":
            handleSaveAnalysis(request.analysisData);
            break;
    }
    return true; // Giữ kênh message mở cho các xử lý bất đồng bộ
});

// === CÁC HÀM XỬ LÝ RIÊNG BIỆT ===

function handleTranslate(request, sender) {
    fetch(GOOGLE_TRANSLATE_URL, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: request.text,
            target: 'vi', // Mục tiêu là tiếng Việt
            format: 'text'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.data.translations) {
            const translatedText = data.data.translations[0].translatedText;
            chrome.tabs.sendMessage(sender.tab.id, {
                action: "displayTranslation",
                original: request.text,
                translation: translatedText
            });
        }
    }).catch(error => console.error("Lỗi Google Translate API:", error));
}

function handleSave(request) {
    fetch(MY_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'firebase_uid': FIREBASE_UID
        },
        body: JSON.stringify({
            vocab: request.vocab,
            meaning: request.meaning,
            part_of_speech: ''
        })
    })
    .then(response => response.json())
    .then(data => console.log('✅ Phản hồi từ server lưu trữ:', data))
    .catch(error => console.error('❌ Lỗi khi lưu:', error));
}

// HÀM MỚI: Xử lý yêu cầu hỏi AI
function handleAskAI(request, sender) {
    const prompt = `
        Analyze the following English word or phrase: "${request.text}".
        Provide the following information in a structured JSON format. 
        The JSON object MUST have these exact keys: "cefr_level", "ipa", "meaning_vi", "forms".
        - For "cefr_level", return ONLY the level code (e.g., "A1", "B2", "C1"). If it's a phrase, provide an estimated level.
        - For "ipa", provide the US phonetic transcription.
        - For "meaning_vi", provide a concise Vietnamese meaning.
        - For "forms", provide an array of objects. Each object should have two keys: "type" (e.g., "Noun", "Verb", "Adjective") and "word" (the corresponding word form).

        Example for "behavior":
        {
          "cefr_level": "B1",
          "ipa": "/bɪˈheɪvjər/",
          "meaning_vi": "hành vi, cách cư xử",
          "forms": [
            { "type": "Verb", "word": "behave" }
          ]
        }
    `;

    fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    })
    .then(response => response.json())
    .then(data => {
        // Trích xuất và làm sạch chuỗi JSON từ phản hồi của Gemini
        const rawText = data.candidates[0].content.parts[0].text;
        const jsonString = rawText.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(jsonString);

        chrome.tabs.sendMessage(sender.tab.id, {
            action: "displayAIResponse",
            data: aiData
        });
    })
    .catch(error => {
        console.error("Lỗi Gemini API:", error);
        chrome.tabs.sendMessage(sender.tab.id, {
            action: "displayAIResponse",
            error: "Không thể kết nối tới AI."
        });
    });
}

// HÀM MỚI: LƯU PHÂN TÍCH VÀO STORAGE
function handleSaveAnalysis(dataToSave) {
    chrome.storage.local.get({ savedAnalyses: [] }, (result) => {
        const analyses = result.savedAnalyses;
        const newAnalysis = {
            id: Date.now(),
            savedAt: new Date().toISOString(),
            ...dataToSave
        };
        analyses.unshift(newAnalysis);
        chrome.storage.local.set({ savedAnalyses: analyses }, () => {
            console.log('✅ Phân tích đã được lưu:', newAnalysis);
        });
    });
}