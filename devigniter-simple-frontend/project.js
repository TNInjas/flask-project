document.getElementById('pm-form').onsubmit = async function(e) {
  e.preventDefault();
  const project_idea = document.getElementById('pm-idea').value;
  const language_or_stack = document.getElementById('pm-language').value;
  const approach_hint = document.getElementById('pm-approach').value;
  try {
    const res = await fetch('/project-mode/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ project_idea, language_or_stack, approach_hint, model_name: 'Mistral_large_latest' })
    });
    const data = await res.json();
    if (data.error) {
      document.getElementById('pm-plan').innerHTML = `<div class="card" style="color:#ef4444;">Error: ${data.error}<br>${data.details ? data.details : ''}</div>`;
    } else {
      document.getElementById('pm-plan').innerHTML = `<div class="card">${renderMarkdown(data.choices ? data.choices[0].message.content : 'No plan generated.')}</div>`;
    }
  } catch (err) {
    document.getElementById('pm-plan').innerHTML = `<div class="card" style="color:#ef4444;">Network error: ${err}</div>`;
  }
};

// --- Assistant/Chatbot Panel for Project Mode ---
const assistantDiv = document.createElement('div');
assistantDiv.id = 'pm-assistant';
assistantDiv.className = 'assistant-panel';
assistantDiv.innerHTML = `
  <h2 style="margin-top:0;">Assistant</h2>
  <div class="chat-history" id="pm-chat-history"></div>
  <form id="pm-chat-form" class="flex-col" style="margin-top:1rem;">
    <input type="text" id="pm-chat-input" placeholder="Ask the assistant about your project..." required />
    <button type="submit">Send</button>
  </form>
`;
document.getElementById('pm-assistant-panel').appendChild(assistantDiv);
const pmChatHistory = document.getElementById('pm-chat-history');
let pmChatHistoryArr = [];
function renderPmChatHistory() {
  pmChatHistory.innerHTML = pmChatHistoryArr.map(msg => `
    <div class="chat-bubble${msg.role === 'user' ? ' user' : ''}">
      <span class="avatar">${msg.role === 'user' ? '🧑' : '🤖'}</span>
      <span class="bubble">${msg.content}</span>
    </div>
  `).join('');
}
document.getElementById('pm-chat-form').onsubmit = async function(e) {
  e.preventDefault();
  const input = document.getElementById('pm-chat-input').value;
  pmChatHistoryArr.push({role: 'user', content: input});
  renderPmChatHistory();
  document.getElementById('pm-chat-input').value = '';
  // Typing animation
  pmChatHistory.innerHTML += `<div class='chat-bubble'><span class='avatar'>🤖</span><span class='bubble'><span class='typing-indicator'><span></span><span></span><span></span></span></span></div>`;
  pmChatHistory.scrollTop = pmChatHistory.scrollHeight;
  try {
    const res = await fetch('/project-mode/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ project_idea: '', language_or_stack: '', approach_hint: '', model_name: 'Mistral_large_latest', messages: pmChatHistoryArr })
    });
    const data = await res.json();
    pmChatHistoryArr.push({role: 'assistant', content: data.choices ? renderMarkdown(data.choices[0].message.content) : 'No response.'});
    renderPmChatHistory();
    pmChatHistory.scrollTop = pmChatHistory.scrollHeight;
  } catch (err) {
    pmChatHistoryArr.push({role: 'assistant', content: `<span style='color:#ef4444;'>Network error: ${err}</span>`});
    renderPmChatHistory();
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

// --- Project Timeline & Milestones Functionality ---
let milestones = [
  { title: 'Project Setup', done: false },
  { title: 'Initial Planning', done: false }
];

function renderTimeline() {
  const timelineDiv = document.getElementById('timeline');
  if (!timelineDiv) return;
  timelineDiv.innerHTML = milestones.map((m, i) => `
    <div class="milestone${m.done ? ' done' : ''}" style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;transition:background 0.2s;">
      <input type="checkbox" ${m.done ? 'checked' : ''} data-idx="${i}" style="transform:scale(1.3);">
      <span style="flex:1;${m.done ? 'text-decoration:line-through;color:#aaa;' : ''}">${m.title}</span>
      <button class="remove-milestone" data-idx="${i}" style="background:#ef4444;color:#fff;border:none;border-radius:4px;padding:0.2rem 0.7rem;cursor:pointer;">✕</button>
    </div>
  `).join('') || '<div style="color:#b5b5b5;">No milestones yet.</div>';
  // Progress bar
  const progress = milestones.length ? Math.round(100 * milestones.filter(m => m.done).length / milestones.length) : 0;
  const progressBar = `<div style="background:#23283a;border-radius:8px;height:18px;width:100%;overflow:hidden;box-shadow:0 1px 6px #3b82f6aa;margin-bottom:0.5rem;">
    <div style="background:linear-gradient(90deg,#3b82f6,#2563eb);height:100%;width:${progress}%;transition:width 0.5s;"></div>
  </div>
  <div style='color:#a0aec0;font-size:0.98rem;text-align:right;'>${progress}% complete</div>`;
  const progressDiv = document.getElementById('milestone-progress');
  if (progressDiv) progressDiv.innerHTML = progressBar;
  document.querySelectorAll('.milestone input[type=checkbox]').forEach(cb => {
    cb.onchange = function() {
      milestones[this.dataset.idx].done = this.checked;
      renderTimeline();
    };
  });
  document.querySelectorAll('.remove-milestone').forEach(btn => {
    btn.onclick = function() {
      milestones.splice(this.dataset.idx, 1);
      renderTimeline();
    };
  });
}

const addBtn = document.getElementById('add-milestone');
if (addBtn) {
  addBtn.onclick = function() {
    const title = prompt('Enter milestone title:');
    if (title && title.trim()) {
      milestones.push({ title: title.trim(), done: false });
      renderTimeline();
    }
  };
}
renderTimeline();