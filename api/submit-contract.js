const https = require('https');

const DROPBOX_TOKEN = 'sl.u.AGewWivtxFvSfkgRsFuueHuKYacvBldbySml--EBIBeb0flcLV5kE6ujZFXFFnSuU4Qozh-_WLJZnZR4wO5zI8tfm4JHfp_mHzW5svgYEfzV6rbXcgGchlZAmu72Nd-oDEWgjI-jJkKpO-6dz1Yp5jMf4FF4wOiIWHbD96kcFPxGiSiz3v2tgxeoJtIUlk6X5DBdzParum9ei1e9fe3gfDP4QiUnJGQNmKhG6Yw1umxpO9pDYx1Vfjiuh-hof2U8x-9jioWYbh5rOnqkAQLUSsD0Q0uLMilIDq2J7scHvRxjwaOyM992mY6yBxB6Y9FTDa8V9VxvOjAWoGQEv0cozpGRtH_6j8xL6XNB_foiiLnkHQBCEa8K37Mc4PPaWev_lAFfREF6i-jyxAuFd6zEoMyhzFmvG2JEkA0ZiWfqTqWOnCva2f37E4FEdTxKTa9V2KPIoSX5OZCRgwCtBuesh-Qx7f3FMQs-OfKvUz2jalGmzf73bJUWXDXlW4GttVBwjRYnYSfwqou3BMhj55wa0Nrj-ssiJK5f-BM5lT-rhjXpKWgORcP5duWAdXtOwlcfyYGCjedAA0LkOB6Ci4zSLBuWRjmPfuCLXT502uHDkp1YnbIUbYvT1aPm4abYv0ifAupJpjBwtnhpf8q_Y1C89shOeIukmBXv_D59nWjxcKaIcd56mANzYxJzkq1L0vfHc1Y-Lhu9Mob5SfPtW-1rTzxg9j0Af8ld45iQ9UyOPIMS-IewN8oDBPIkLt2RkxPHw2Xkwv6GWLIvMBcynjZGENH21phzRuMDyMwPeEyfIQ_QlDw8HLZ-nhXsugHH5Yrr2DMxQ3AuPgjkinZhTGSHkLhWUbqJnexkkNgC4irYqVJ1l_C2nsstfRKePv0z7WDBlkHEiEv1Awz7urkQ9rvKhYHFhzST9YWKFSmbROnNif5KEp8zMlLUABYfr4LBRNY35flKrfQRoLEXSndfXtIy6DiixPDKbu-r0ChPkaKr2yh4Qssg6Av1Bar8gkcI39hSQajZ_KARJAW3mfhI6PWwu1SGFqGH3gLhYv6CBi9FSu2vXlCVUl5uoWNT_8vidfYGptyPFnDoyf62VVccYdYW49bpdIooNyybYDI4DXVlsHG9jdEoX_Y42kqetgnML7JkoMs25GG5r4QTOLBX5YTjtzC5A-0grc_9edOt8T7urk6w37TIntka1zWxKY4-lw0yU1MqYpzPeZPu0Wrra1Pq3dr-e_OoLHArey5K2Jia39uRi04uvaoHfnnbgLu_fW8FjzmeOUpJgB0LfAr608HYRt1O6-HQYbYwNJsddry5V1ibevFGhCFITSFB6XckTBjKBRxCHej5PWKdvkQhFJvOSv2JF3Kca1YGkLAkqIxbqCOKWssTQD_wxULng6HfUHCEyLhbGnVQtrHbGa7WIkkDNZYKM9c9kGA6IoL9UIfmlULu9A';

function uploadToDropbox(path, buffer) {
  return new Promise((resolve, reject) => {
    const apiArg = JSON.stringify({ path, mode: 'overwrite', autorename: false });
    const options = {
      hostname: 'content.dropboxapi.com',
      path: '/2/files/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': apiArg,
        'Content-Length': buffer.length
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Dropbox upload failed: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { pdfBase64, brideName, weddingDate } = req.body;

    if (!pdfBase64 || !brideName || !weddingDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const safeName = brideName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    const safeDate = weddingDate.replace(/[^0-9-]/g, '');
    const dropboxPath = `/MakeupBySherryB/Contracts/${safeDate}_${safeName}_Contract.pdf`;

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    await uploadToDropbox(dropboxPath, pdfBuffer);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-contract error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
