import json
import argparse
import os
from cryptography.fernet import Fernet

# CLI argument parsing
parser = argparse.ArgumentParser(description='Decrypt a user file and output it as plaintext JSON.')
parser.add_argument('-username', required=True, help='The username (to find ../users/<username>.json)')
parser.add_argument('-key', help='Path to the encryption key (default: ../Key/encryption.key)')

args = parser.parse_args()

# Calculate base path (parent of script directory)
script_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.abspath(os.path.join(script_dir, '..'))

# Key path (default: ../Key/encryption.key)
default_key_path = os.path.join(base_dir, 'Key', 'encryption.key')
key_path = os.path.abspath(args.key) if args.key else default_key_path

# User file path: ../Data/users/<username>.json
user_file = os.path.join(base_dir, 'Data/users', f'{args.username}.json')

# Load encryption key
if not os.path.exists(key_path):
    print(f"Error: Key file '{key_path}' not found.")
    exit(1)

with open(key_path, 'rb') as key_file:
    key = key_file.read()

cipher = Fernet(key)

# Load and decrypt user file
if not os.path.exists(user_file):
    print(f"Error: Encrypted user file '{user_file}' not found.")
    exit(1)

with open(user_file, 'rb') as encrypted_file:
    encrypted_data = encrypted_file.read()

decrypted_data = cipher.decrypt(encrypted_data)
data = json.loads(decrypted_data)

# Decrypt password field
encrypted_password = data['password'].encode()
decrypted_password = cipher.decrypt(encrypted_password).decode()
data['password'] = decrypted_password

# Output result to a local file (e.g., ./AlexutzuSoft.txt)
output_file = f"{args.username}.txt"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print(f"Decryption complete. Output saved to {output_file}")
