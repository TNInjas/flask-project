// Simple SPA logic for DevIgniter
const mainContent = document.getElementById('main-content');

function clearContent() {
  mainContent.innerHTML = '';
}

function renderHome() {
  clearContent();
}

function renderChatbot(containerId, contextType) {
  const chatHtml = `
    <div class="card" style="max-height:300px;overflow-y:auto;" id="chat-history"></div>
    <form id="chat-form" class="flex-row">
      <input type="text" id="chat-input" placeholder="Ask the assistant..." style="flex:1;" required />
      <button type="submit">Send</button>
    </form>
  `;
  document.getElementById(containerId).innerHTML = chatHtml;
  const chatHistory = document.getElementById('chat-history');
  document.getElementById('chat-form').onsubmit = async function(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input').value;
    chatHistory.innerHTML += `<div style='text-align:right'><b>You:</b> ${input}</div>`;
    document.getElementById('chat-input').value = '';
    chatHistory.innerHTML += `<div><b>Assistant:</b> <span style='color:#3b82f6'>Thinking...</span></div>`;
    // Call backend API for assistant reply
    let endpoint = '';
    let payload = {};
    if (contextType === 'question') {
      endpoint = '/question-practice/generate';
      payload = { concept: input, language: 'python', level: 'Beginner', num_questions: 1, model_name: 'Deepseek_R1' };
    } else if (contextType === 'concept') {
      endpoint = '/concept-revision/explain';
      payload = { concept: input, language: 'python', model_name: 'Deepseek_R1' };
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      chatHistory.innerHTML = chatHistory.innerHTML.replace('Thinking...', data.choices ? data.choices[0].message.content : 'No response.');
      chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (err) {
      chatHistory.innerHTML = chatHistory.innerHTML.replace('Thinking...', 'Error contacting assistant.');
    }
  };
}

function renderQuestionPractice() {
  clearContent();
  mainContent.innerHTML = `
    <div class="flex-row">
      <div style="flex:1;min-width:300px;">
        <h2>🧠 Question Practice Mode</h2>
        <form id="qp-form" class="flex-col">
          <input type="text" id="qp-concept" placeholder="Concept (e.g. Recursion)" required />
          <input type="text" id="qp-language" placeholder="Language (e.g. Python)" required />
          <select id="qp-level">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <input type="number" id="qp-num" placeholder="Number of Questions" min="1" max="10" value="5" required />
          <button type="submit">Generate Questions</button>
        </form>
        <div id="qp-questions"></div>
      </div>
      <div style="flex:1;min-width:250px;" id="qp-chatbot"></div>
    </div>
  `;
  document.getElementById('qp-form').onsubmit = async function(e) {
    e.preventDefault();
    const concept = document.getElementById('qp-concept').value;
    const language = document.getElementById('qp-language').value;
    const level = document.getElementById('qp-level').value;
    const num = document.getElementById('qp-num').value;
    const res = await fetch('/question-practice/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept, language, level, num_questions: num, model_name: 'Deepseek_R1' })
    });
    const data = await res.json();
    document.getElementById('qp-questions').innerHTML = `<div class="card">${data.choices ? data.choices[0].message.content : 'No questions generated.'}</div>`;
  };
  renderChatbot('qp-chatbot', 'question');
}

function renderConceptRevision() {
  clearContent();
  mainContent.innerHTML = `
    <div class="flex-row">
      <div style="flex:1;min-width:300px;">
        <h2>📘 Concept Revision Mode</h2>
        <form id="cr-form" class="flex-col">
          <input type="text" id="cr-concept" placeholder="Concept (e.g. OOP)" required />
          <input type="text" id="cr-language" placeholder="Language (e.g. Python)" required />
          <button type="submit">Generate Explanation</button>
        </form>
        <div id="cr-explanation"></div>
      </div>
      <div style="flex:1;min-width:250px;" id="cr-chatbot"></div>
    </div>
  `;
  document.getElementById('cr-form').onsubmit = async function(e) {
    e.preventDefault();
    const concept = document.getElementById('cr-concept').value;
    const language = document.getElementById('cr-language').value;
    const res = await fetch('/concept-revision/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept, language, model_name: 'Deepseek_R1' })
    });
    const data = await res.json();
    document.getElementById('cr-explanation').innerHTML = `<div class="card">${data.choices ? data.choices[0].message.content : 'No explanation generated.'}</div>`;
  };
  renderChatbot('cr-chatbot', 'concept');
}

function renderProjectMode() {
  clearContent();
  mainContent.innerHTML = `
    <div class="flex-row">
      <div style="flex:1;min-width:300px;">
        <h2>💻 Project Mode</h2>
        <form id="pm-form" class="flex-col">
          <input type="text" id="pm-idea" placeholder="Project Idea (e.g. ToDo App)" required />
          <input type="text" id="pm-language" placeholder="Language/Stack (e.g. Python)" required />
          <input type="text" id="pm-approach" placeholder="Approach Hint (optional)" />
          <button type="submit">Plan Project</button>
        </form>
        <div id="pm-plan"></div>
        <h3 style="margin-top:2rem;">Code Editor (Monaco)</h3>
        <iframe src="https://microsoft.github.io/monaco-editor/playground.html" style="width:100%;height:350px;border-radius:8px;border:none;background:#23283a;"></iframe>
      </div>
    </div>
  `;
  document.getElementById('pm-form').onsubmit = async function(e) {
    e.preventDefault();
    const project_idea = document.getElementById('pm-idea').value;
    const language_or_stack = document.getElementById('pm-language').value;
    const approach_hint = document.getElementById('pm-approach').value;
    const res = await fetch('/project-mode/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_idea, language_or_stack, approach_hint, model_name: 'Deepseek_R1' })
    });
    const data = await res.json();
    document.getElementById('pm-plan').innerHTML = `<div class="card">${data.choices ? data.choices[0].message.content : 'No plan generated.'}</div>`;
  };
}

// --- Routing logic for separate pages ---
function navigateTo(page) {
  window.history.pushState({}, '', page);
  if (page === '/question-practice') renderQuestionPractice();
  else if (page === '/concept-revision') renderConceptRevision();
  else if (page === '/project-mode') renderProjectMode();
  else renderHome();
}

window.onpopstate = function() {
  const path = window.location.pathname;
  if (path === '/question-practice') renderQuestionPractice();
  else if (path === '/concept-revision') renderConceptRevision();
  else if (path === '/project-mode') renderProjectMode();
  else renderHome();
};

function setupNavigation() {
  document.getElementById('question-mode').onclick = () => navigateTo('/question-practice');
  document.getElementById('concept-mode').onclick = () => navigateTo('/concept-revision');
  document.getElementById('project-mode').onclick = () => navigateTo('/project-mode');
}

window.onload = function() {
  const path = window.location.pathname;
  if (path === '/question-practice') renderQuestionPractice();
  else if (path === '/concept-revision') renderConceptRevision();
  else if (path === '/project-mode') renderProjectMode();
  else renderHome();
  setupNavigation();
};