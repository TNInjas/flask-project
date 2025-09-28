from flask import Flask, request, jsonify, Blueprint, send_from_directory
from flask_cors import CORS
from main import Model_communication
from Prompts.Concept_revision_prompt import build_concept_prompt
from Prompts.Project_prompt import build_project_prompt
import os

app = Flask(__name__)
CORS(app)
model_comm = Model_communication()

# --- Question Practice Mode ---
question_practice_bp = Blueprint('question_practice', __name__)

@question_practice_bp.route('/generate', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        # Build a prompt for question generation
        prompt = (
            f"Generate {data.get('num_questions', 5)} practical coding questions "
            f"about the concept '{data.get('concept', '')}' in {data.get('language', '')} "
            f"for a {data.get('level', 'beginner')} learner."
        )
        response = model_comm.call_model(
            model_name=data.get('model_name', 'Deepseek_V3.1'),
            prompt=prompt
        )
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@question_practice_bp.route('/ask', methods=['POST'])
def ask_question_assistant():
    try:
        data = request.json
        # Just send the user messages directly to the model, no prompt wrapping
        response = model_comm.call_model(
            model_name=data.get('model_name', 'Deepseek_V3.1'),
            messages=data.get('messages', [])
        )
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Concept Revision Mode ---
concept_revision_bp = Blueprint('concept_revision', __name__)

@concept_revision_bp.route('/explain', methods=['POST'])
def explain_concept():
    try:
        data = request.json
        prompt = build_concept_prompt(
            concept=data.get('concept', ''),
            language=data.get('language', '')
        )
        response = model_comm.call_model(
            model_name=data.get('model_name', 'Deepseek_R1'),
            prompt=prompt
        )
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@concept_revision_bp.route('/ask', methods=['POST'])
def ask_concept_assistant():
    try:
        data = request.json
        # Just send the user messages directly to the model, no prompt wrapping
        response = model_comm.call_model(
            model_name=data.get('model_name', 'Deepseek_R1'),
            messages=data.get('messages', [])
        )
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Project Mode ---
project_mode_bp = Blueprint('project_mode', __name__)

@project_mode_bp.route('/plan', methods=['POST'])
def plan_project():
    try:
        data = request.json
        prompt = build_project_prompt(
            project_idea=data.get('project_idea', ''),
            language_or_stack=data.get('language_or_stack', ''),
            approach_hint=data.get('approach_hint', '')
        )
        response = model_comm.call_model(
            model_name=data.get('model_name', 'Mistral_large_latest'),
            prompt=prompt
        )
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Register Blueprints
app.register_blueprint(question_practice_bp, url_prefix='/question-practice')
app.register_blueprint(concept_revision_bp, url_prefix='/concept-revision')
app.register_blueprint(project_mode_bp, url_prefix='/project-mode')

@app.route("/", methods=["GET"])
def serve_index():
    return send_from_directory(os.path.join(app.root_path, "devigniter-simple-frontend"), "index.html")

@app.route("/project.html")
def serve_project():
    return send_from_directory(os.path.join(app.root_path, "devigniter-simple-frontend"), "project.html")

@app.route("/question.html")
def serve_question():
    return send_from_directory(os.path.join(app.root_path, "devigniter-simple-frontend"), "question.html")

@app.route("/concept.html")
def serve_concept():
    return send_from_directory(os.path.join(app.root_path, "devigniter-simple-frontend"), "concept.html")

@app.route('/<path:filename>')
def serve_static(filename):
    frontend_dir = os.path.join(app.root_path, 'devigniter-simple-frontend')
    if os.path.exists(os.path.join(frontend_dir, filename)):
        return send_from_directory(frontend_dir, filename)
    return jsonify({'error': 'Not Found', 'message': 'The requested file was not found.'}), 404

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not Found', 'message': 'The requested URL was not found on the server.'}), 404

if __name__ == "__main__":
    # Startup environment check for API keys and URLs
    missing = []
    from main import Model_communication
    mc = Model_communication()
    for model in mc.model_map:
        if not mc.urls.get(model):
            missing.append(f"URL for {model}")
        if not mc.api_keys.get(model):
            missing.append(f"API key for {model}")
    if missing:
        print("[ERROR] Missing configuration:", ", ".join(missing))
    else:
        print("[INFO] All model URLs and API keys are configured.")
    app.run(debug=True)