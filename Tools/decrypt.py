import json
from cryptography.fernet import Fernet

# Move the encryption.key file to the current directory.

# Load the encryption key
with open('encryption.key', 'rb') as key_file:
    key = key_file.read()

# Initialize Fernet
cipher = Fernet(key)

# Read and decrypt the full file
with open('users/username.json', 'rb') as encrypted_file:
    encrypted_data = encrypted_file.read()

decrypted_data = cipher.decrypt(encrypted_data)

# Load decrypted data as JSON
data = json.loads(decrypted_data)

# Decrypt the password field
encrypted_password = data['password'].encode()
decrypted_password = cipher.decrypt(encrypted_password).decode()

# Update the password field with the decrypted password
data['password'] = decrypted_password

# Save the fully decrypted content to username.txt
with open('username.txt', 'w', encoding='utf-8') as output_file:
    json.dump(data, output_file, indent=4)

print("Fully decrypted and saved as username.txt!")