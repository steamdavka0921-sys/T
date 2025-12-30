const fetch = require("node-fetch");

exports.handler = async (event) => {
  // Зөвхөн POST хүсэлт хүлээж авна (Telegram-аас ирэх хүсэлт)
  if (event.httpMethod !== "POST") {
    return { statusCode: 200, body: "Method Not Allowed" };
  }

  const update = JSON.parse(event.body);
  const TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_CHAT_ID;
  const API = `https://api.telegram.org/bot${TOKEN}`;

  try {
    // 1. Хэрэглэгч /start дарахад
    if (update.message && update.message.text === "/start") {
      await fetch(`${API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: update.message.chat.id,
          text: "Сайн байна уу? Доорх товчийг дарж цэнэглэнэ үү.",
          reply_markup: {
            inline_keyboard: [[
              { text: "💰 Цэнэглэх", callback_data: "request_recharge" }
            ]]
          }
        })
      });
    }

    // 2. Цэнэглэх товч дарагдах үед
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const userId = update.callback_query.from.id;
      const firstName = update.callback_query.from.first_name;
      const username = update.callback_query.from.username ? `@${update.callback_query.from.username}` : "Username байхгүй";

      if (callbackData === "request_recharge") {
        // Танд (Админ руу) ирэх мэдэгдэл
        await fetch(`${API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: ADMIN_ID,
            text: `🔔 МЭДЭГДЭЛ: Хэрэглэгч цэнэглэх хүсэлт гаргалаа!\n\n👤 Нэр: ${firstName}\n🆔 ID: ${userId}\n📧 Username: ${username}`
          })
        });

        // Хэрэглэгчид "Хүлээж авлаа" гэсэн хариу өгөх
        await fetch(`${API}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: update.callback_query.id,
            text: "Хүсэлтийг админд илгээлээ. Түр хүлээнэ үү.",
            show_alert: true
          })
        });
      }
    }
  } catch (error) {
    console.error("Алдаа гарлаа:", error);
  }

  return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
};
