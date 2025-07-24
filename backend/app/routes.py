from flask import Blueprint, request, jsonify
from .supabase_client import supabase

bp = Blueprint('main', __name__)
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
live_sessions_bp = Blueprint('live_sessions', __name__, url_prefix='/live_sessions')
products_bp = Blueprint('products', __name__, url_prefix='/products')
messages_bp = Blueprint('messages', __name__, url_prefix='/messages')
image_upload_bp = Blueprint('image_upload', __name__, url_prefix='/image_upload')
reservations_bp = Blueprint('reservations', __name__, url_prefix='/reservations')

@bp.route('/')
def index():
    return "Hello, World! This is the Antique Feed Backend."

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        response = supabase.auth.sign_up({'email': email, 'password': password})
        return jsonify(response.user.dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        response = supabase.auth.sign_in_with_password({'email': email, 'password': password})
        return jsonify(response.user.dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        supabase.auth.sign_out()
        return jsonify({'message': 'Successfully logged out'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        response = supabase.from_('profiles').select('*').eq('user_id', user_id).execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'message': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/profile/<user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.get_json()
    try:
        response = supabase.from_('profiles').update(data).eq('user_id', user_id).execute()
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/fix-auth-domains', methods=['POST'])
def fix_auth_domains():
    # This endpoint will replace the supabase.functions.invoke('fix-auth-domains')
    # Implement the logic here to fix auth domains if needed.
    return jsonify({'message': 'fix-auth-domains endpoint placeholder'}), 200

@live_sessions_bp.route('/', methods=['POST'])
def create_live_session():
    data = request.get_json()
    try:
        response = supabase.from_('live_sessions').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@live_sessions_bp.route('/', methods=['GET'])
def get_live_sessions():
    try:
        response = supabase.from_('live_sessions').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@live_sessions_bp.route('/end/<session_id>', methods=['POST'])
def end_live_session(session_id):
    try:
        response = supabase.rpc('end_live_session', {'session_id': session_id}).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/', methods=['POST'])
def create_product():
    data = request.get_json()
    try:
        response = supabase.from_('products').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/', methods=['GET'])
def get_products():
    product_id = request.args.get('id')
    try:
        query = supabase.from_('products').select('*')
        if product_id:
            query = query.eq('id', product_id)
        response = query.execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/reserve/<product_id>', methods=['POST'])
def reserve_product(product_id):
    try:
        response = supabase.rpc('reserve_product', {'product_id': product_id}).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/status/<product_id>', methods=['PUT'])
def update_product_status(product_id):
    data = request.get_json()
    status = data.get('status')
    try:
        response = supabase.rpc('update_product_status', {'product_id': product_id, 'status': status}).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@messages_bp.route('/<session_id>', methods=['GET'])
def get_messages(session_id):
    try:
        response = supabase.from_('session_messages').select('*').eq('session_id', session_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@messages_bp.route('/', methods=['POST'])
def send_message():
    data = request.get_json()
    try:
        response = supabase.from_('session_messages').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@image_upload_bp.route('/', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        try:
            # Assuming a bucket named 'product_images'
            # You might want to generate a unique filename
            filename = file.filename
            response = supabase.storage.from_('product_images').upload(filename, file.read())
            return jsonify({'message': 'Image uploaded successfully', 'path': response.path}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 400

@reservations_bp.route('/', methods=['POST'])
def create_reservation():
    data = request.get_json()
    try:
        response = supabase.from_('reservations').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
