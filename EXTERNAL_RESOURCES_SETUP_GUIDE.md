# 🔑 External Resources & Setup Guide (बाहरी चीज़ें और उन्हें लेने का पूरा प्रोसेस)

Mudra Tube को लाइव चलाने के लिए आपको कुल **4 मुख्य बाहरी सर्विसेज़ (External Services)** की ज़रूरत होगी।  
अगर आपके पास अभी ये नहीं हैं, तो चिंता न करें—ऐप में **स्मार्ट सिम्युलेशन (Demo Mode)** इनबिल्ट है, जिससे आप इसे बिना किसी की (Key) के भी तुरंत चलाकर टेस्ट कर सकते हैं।

---

## 📋 संक्षेप में क्या-क्या चाहिए (Quick Summary Checklist)

1. **Telegram Bot Token** 🤖 — चैनल जॉइन वेरिफ़ाई करने और बॉट मेनू बटन सेट करने के लिए।
2. **Firebase Firestore Database** 🗄️ — यूज़र्स, बैलेंस, टास्क और विड्रॉल रियल-टाइम सेव करने के लिए (Free Tier उपलब्ध)।
3. **CPA Offerwall Account (वैकल्पिक / Optional)** 🎁 — यूज़र्स को सर्वे और ऐप इंस्टॉल टास्क देकर पैसे कमाने के लिए (जैसे Monlix या Wannads)।
4. **Admin Login Credentials** 🔐 — सीक्रेट एडमिन पैनल (`/admin-penel-29devs`) के लिए आपका पर्सनल यूज़रनेम और पासवर्ड।

---

## 1. Telegram Bot Token कैसे प्राप्त करें (How to get Bot Token)

### यह क्यों चाहिए?
जब कोई यूज़र किसी चैनल को जॉइन करने का टास्क पूरा करेगा, तो आपका बॉट Telegram Bot API (`getChatMember`) का उपयोग करके चेक करेगा कि क्या यूज़र सच में चैनल का मेंबर बना है या नहीं।

### स्टेप-बाय-स्टेप प्रोसेस:
1. अपने फ़ोन या PC पर **Telegram** खोलें।
2. सर्च बार में **`@BotFather`** टाइप करें (ब्लू टिक वाला ऑफिशियल बॉट चुनें)।
3. **`Start`** बटन दबाएं या मैसेज भेजें:
   ```text
   /newbot
   ```
4. BotFather आपसे आपके बॉट का नाम पूछेगा:
   - उदाहरण: `Mudra Tube Official`
5. इसके बाद बॉट का एक यूनीक यूज़रनेम डालें (जिसके अंत में `bot` होना ज़रूरी है):
   - उदाहरण: `MudraTube_bot` या `MudraTube29_bot`
6. BotFather आपको एक **HTTP API Token** देगा। यह कुछ ऐसा दिखेगा:
   ```text
   7123456789:AAFxYourTelegramBotTokenHere12345
   ```
7. इस टोकन को कॉपी करके अपने प्रोजेक्ट की `.env` फ़ाइल में डालें:
   ```env
   TELEGRAM_BOT_TOKEN="7123456789:AAFxYourTelegramBotTokenHere12345"
   TELEGRAM_BOT_USERNAME="MudraTube_bot"
   ```

### ज़रूरी काम: बॉट को प्रमोटेड चैनल का Admin बनाना:
> **महत्वपूर्ण**: जब भी आप किसी चैनल को प्रमोट करेंगे, अपने बॉट को उस चैनल में **Administrator** बनाएं (ताकि बॉट मेंबर्स लिस्ट चेक कर सके)।

### बॉट में WebApp Menu Button लगाना:
1. `@BotFather` को `/mybots` भेजें।
2. अपना बॉट चुनें $\rightarrow$ **Bot Settings** $\rightarrow$ **Menu Button** $\rightarrow$ **Configure menu button** दबाएं।
3. अपनी डिप्लॉयड वेबसाइट का URL (जैसे `https://your-mudratube.vercel.app`) पेस्ट करें।
4. बटन का नाम रखें: `🪙 Earn Coins`.

---

## 2. Firebase Firestore Database कैसे बनाएं (Free Database Setup)

### यह क्यों चाहिए?
यूज़र का बैलेंस, कॉइन्स, कम्प्लीटेड टास्क, और विड्रॉल रिक्वेस्ट्स को लाइव रियल-टाइम सिंक करने के लिए।

### स्टेप-बाय-स्टेप प्रोसेस:
1. अपने ब्राउज़र में [Firebase Console](https://console.firebase.google.com/) खोलें (अपने Google Account से लॉगिन करें)।
2. **"Add project"** (प्रोजेक्ट जोड़ें) पर क्लिक करें।
3. प्रोजेक्ट का नाम रखें: `mudra-tube` $\rightarrow$ Continue दबाएं।
4. Google Analytics को चाहें तो Disable करके **Create project** दबाएं।
5. प्रोजेक्ट बनने के बाद:
   - लेफ्ट साइडबार में **Build** $\rightarrow$ **Firestore Database** पर जाएं।
   - **Create database** पर क्लिक करें।
   - लोकेशन में `asia-south1 (Mumbai)` या अपने नज़दीकी रीजन को चुनें।
   - Security Rules में **"Start in production mode"** चुनें और Done दबाएं।
6. **Web App Config प्राप्त करें**:
   - प्रोजेक्ट के होमपेज (Project Overview) पर जाएं।
   - गियर आइकन (Project Settings) पर क्लिक करें।
   - नीचे स्क्रॉल करें और **"Your apps"** सेक्शन में Web (`</>`) आइकन पर क्लिक करें।
   - App का नाम `MudraTubeWeb` रखें $\rightarrow$ Register App दबाएं।
   - आपको एक `firebaseConfig` ऑब्जेक्ट मिलेगा, जिसमें ये कीज़ होंगी:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="mudra-tube.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="mudra-tube"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="mudra-tube.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef"
   ```
7. इन सभी वैल्यूज़ को अपनी `.env` फ़ाइल में सेव करें।

---

## 3. CPA Offerwall पार्टनर कैसे जोड़ें (Optional / For Extra Earnings)

### यह क्यों चाहिए?
यदि आप यूज़र्स को वीडियो ऐड्स के बिना ऐप डाउनलोड्स और सर्वे टास्क देना चाहते हैं, जिससे वे ज़्यादा कॉइन्स कमा सकें और आपको CPA नेटवर्क से डॉलर/रुपये मिलें।

### लोकप्रिय CPA नेटवर्क:
1. **Monlix** ([monlix.com](https://monlix.com)) - टेलीग्राम वेब ऐप्स के लिए बहुत लोकप्रिय है।
2. **Wannads** ([wannads.com](https://wannads.com))
3. **CPALead** ([cpalead.com](https://cpalead.com))

### प्रोसेस:
1. किसी भी नेटवर्क पर Publisher अकाउंट बनाएं।
2. अपना App रजिस्टर करें (Type: Web App)।
3. आपको एक **Offerwall iframe URL** मिलेगा, जैसे:
   ```text
   https://offers.monlix.com/?app_id=XXXX&subid=
   ```
4. इस URL को `.env` में `CPA_OFFERWALL_BASE_URL` पर सेट करें। ऐप खुद-ब-खुद हर यूज़र की Telegram ID को `subid` के रूप में जोड़ देगा।

---

## 4. Admin Credentials सेट करना (`/admin-penel-29devs`)

### यह क्यों चाहिए?
सीक्रेट यूआरएल (`/admin-penel-29devs`) पर केवल आप (एडमिन) लॉगिन कर सकें।

### प्रोसेस:
अपनी `.env` फ़ाइल में अपना मनचाहा यूज़रनेम और पासवर्ड सेट करें:
```env
ADMIN_SECRET_ROUTE="/admin-penel-29devs"
ADMIN_USERNAME="admin29"
ADMIN_PASSWORD="YourStrongPassword2026@"
```

---

## 5. फ़्री होस्टिंग (Vercel पर 1-Click में Live करना)

1. [Vercel.com](https://vercel.com) पर जाएं (GitHub से लॉगिन करें)।
2. **Add New** $\rightarrow$ **Project** पर क्लिक करें।
3. अपने MudraTube गिट रिपॉजिटरी को सेलेक्ट करें।
4. **Environment Variables** में ऊपर दी गई सभी वैल्यूज़ पेस्ट करें।
5. **Deploy** बटन दबाएं — 1 मिनट में आपकी वेबसाइट लाइव हो जाएगी!
