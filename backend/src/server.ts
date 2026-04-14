import app from './app';
import config from './config/env';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📦 Môi trường: ${config.env}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1\n`);
});
