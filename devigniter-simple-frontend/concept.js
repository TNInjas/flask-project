document.getElementById('cr-form').onsubmit = async function(e) {
  e.preventDefault();
  const concept = document.getElementById('cr-concept').value;
  const language = document.getElementById('cr-language').value;
  // Only send the concept as a message to the backend
  try {
    const res = await fetch('/concept-revision/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ concept, language, model_name: 'Mistral_large_latest' })
    });
    const data = await res.json();
    if (data.error) {
      document.getElementById('cr-explanation').innerHTML = `<div class="card" style="color:#ef4444;">Error: ${data.error}<br>${data.details ? data.details : ''}</div>`;
    } else {
      document.getElementById('cr-explanation').innerHTML = `<div class="card">${renderMarkdown(data.choices ? data.choices[0].message.content : 'No explanation generated.')}</div>`;
    }
  } catch (err) {
    document.getElementById('cr-explanation').innerHTML = `<div class="card" style="color:#ef4444;">Network error: ${err}</div>`;
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

// Remove duplicate/old chat UI and logic for concept revision assistant
// Only keep the assistant-panel/chat-bubble UI and its logic

const crChatDiv = document.createElement('div');
crChatDiv.className = 'assistant-panel';
crChatDiv.innerHTML = `
  <h2 style="margin-top:0;">Assistant</h2>
  <div class="chat-history" id="cr-chat-history"></div>
  <form id="cr-chat-form" class="flex-col" style="margin-top:1rem;">
    <input type="text" id="cr-chat-input" placeholder="Ask about this concept..." required />
    <button type="submit">Send</button>
  </form>
`;
document.getElementById('cr-chatbot').appendChild(crChatDiv);
const crChatHistory = document.getElementById('cr-chat-history');
let crChatHistoryArr = [];
document.getElementById('cr-chat-form').onsubmit = async function(e) {
  e.preventDefault();
  const input = document.getElementById('cr-chat-input').value;
  crChatHistoryArr.push({role: 'user', content: input});
  renderCrChatHistory();
  document.getElementById('cr-chat-input').value = '';
  // Typing animation
  crChatHistory.innerHTML += `<div class='chat-bubble'><span class='avatar'>🤖</span><span class='bubble'><span class='typing-indicator'><span></span><span></span><span></span></span></span></div>`;
  crChatHistory.scrollTop = crChatHistory.scrollHeight;
  try {
    const res = await fetch('/concept-revision/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: crChatHistoryArr })
    });
    const data = await res.json();
    crChatHistoryArr.push({role: 'assistant', content: data.choices ? data.choices[0].message.content : 'No response.'});
    renderCrChatHistory();
    crChatHistory.scrollTop = crChatHistory.scrollHeight;
  } catch (err) {
    crChatHistoryArr.push({role: 'assistant', content: `<span style='color:#ef4444;'>Network error: ${err}</span>`});
    renderCrChatHistory();
  }
};

function renderCrChatHistory() {
  crChatHistory.innerHTML = crChatHistoryArr.map(msg => `
    <div class="chat-bubble${msg.role === 'user' ? ' user' : ''}">
      <span class="avatar">${msg.role === 'user' ? '🧑' : '🤖'}</span>
      <span class="bubble">${msg.content}</span>
    </div>
  `).join('');

}
