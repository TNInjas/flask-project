document.getElementById('qp-form').onsubmit = async function(e) {
  e.preventDefault();
  const concept = document.getElementById('qp-concept').value;
  const language = document.getElementById('qp-language').value;
  const level = document.getElementById('qp-level').value;
  const num = document.getElementById('qp-num').value;
  try {
    const res = await fetch('/question-practice/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ concept, language, level, num_questions: num, model_name: 'Mistral_large_latest' })
    });
    const data = await res.json();
    if (data.error) {
      document.getElementById('qp-questions').innerHTML = `<div class=\"card\" style=\"color:#ef4444;\">Error: ${data.error}<br>${data.details ? data.details : ''}</div>`;
    } else {
      document.getElementById('qp-questions').innerHTML = `<div class=\"card\">${renderMarkdown(data.choices ? data.choices[0].message.content : 'No questions generated.')}</div>`;
    }
  } catch (err) {
    document.getElementById('qp-questions').innerHTML = `<div class=\"card\" style=\"color:#ef4444;\">Network error: ${err}</div>`;
  }
};

// Chatbot for Question Practice Mode (uses Deepseek_V3)
const qpChatDiv = document.createElement('div');
qpChatDiv.className = 'assistant-panel';
qpChatDiv.innerHTML = `
  <h2 style="margin-top:0;">Assistant</h2>
  <div class="chat-history" id="qp-chat-history"></div>
  <form id="qp-chat-form" class="flex-col" style="margin-top:1rem;">
    <input type="text" id="qp-chat-input" placeholder="Ask about this question set..." required />
    <button type="submit">Send</button>
  </form>
`;
document.getElementById('qp-chatbot').appendChild(qpChatDiv);
const qpChatHistory = document.getElementById('qp-chat-history');
let qpChatHistoryArr = [];
function renderQpChatHistory() {
  qpChatHistory.innerHTML = qpChatHistoryArr.map(msg => `
    <div class="chat-bubble${msg.role === 'user' ? ' user' : ''}">
      <span class="avatar">${msg.role === 'user' ? '🧑' : '🤖'}</span>
      <span class="bubble">${msg.content}</span>
    </div>
  `).join('');
}
document.getElementById('qp-chat-form').onsubmit = async function(e) {
  e.preventDefault();
  const input = document.getElementById('qp-chat-input').value;
  qpChatHistoryArr.push({role: 'user', content: input});
  renderQpChatHistory();
  document.getElementById('qp-chat-input').value = '';
  // Typing animation
  qpChatHistory.innerHTML += `<div class='chat-bubble'><span class='avatar'>🤖</span><span class='bubble'><span class='typing-indicator'><span></span><span></span><span></span></span></span></div>`;
  qpChatHistory.scrollTop = qpChatHistory.scrollHeight;
  try {
    const res = await fetch('/question-practice/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: qpChatHistoryArr, model_name: 'Deepseek_V3.1' })
    });
    const data = await res.json();
    qpChatHistoryArr.push({role: 'assistant', content: data.choices ? data.choices[0].message.content : 'No response.'});
    renderQpChatHistory();
    qpChatHistory.scrollTop = qpChatHistory.scrollHeight;
  } catch (err) {
    qpChatHistoryArr.push({role: 'assistant', content: `<span style='color:#ef4444;'>Network error: ${err}</span>`});
    renderQpChatHistory();
  }
};

function renderMarkdown(text) {
  // Simple markdown renderer for code blocks and bold/italic
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '<br>')
    .replace(/\#\s?(.*)/g, '<h3>$1</h3>');

}
