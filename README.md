# Manga Reader

Đọc truyện tranh từ Google Drive, giao diện cuộn dọc (webtoon style).

## Setup

```bash
cp .env.example .env
# Điền GOOGLE_API_KEY và DRIVE_FOLDER_ID vào .env
```

### Lấy Google API Key
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới → Enable **Google Drive API**
3. Credentials → Create API Key
4. Paste API key vào `.env`

### Lấy Drive Folder ID
URL thư mục gốc trên Drive: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
Copy phần `FOLDER_ID_HERE` vào `.env`

## Crawl data

```bash
npm run crawl
```

Script sẽ quét toàn bộ thư mục trên Drive và tạo file `src/data.json`.

## Dev

```bash
npm run dev
```

Mở http://localhost:3000

## Deploy lên Railway

1. Push code lên GitHub
2. Vào [Railway](https://railway.app) → New Project → Deploy from GitHub
3. Railway sẽ tự detect Dockerfile và build
4. App sẽ live trên URL được cấp

Hoặc dùng Railway CLI:
```bash
railway login
railway init
railway up
```
