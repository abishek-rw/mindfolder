import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import FastAPI, HTTPException, Depends
from appwrite.exception import AppwriteException
from dotenv import load_dotenv
import os
import random
import hashlib
from datetime import datetime, timedelta, timezone
from appwrite.client import Client
from appwrite.services.databases import Databases
import uuid
from dateutil import parser
from appwrite.query import Query
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Appwrite configurations
APPWRITE_API_ENDPOINT = os.getenv("APPWRITE_API_ENDPOINT")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")
APPWRITE_COLLECTION_ID_USERS = os.getenv("APPWRITE_COLLECTION_ID_USERS")
APPWRITE_COLLECTION_ID_OTP = os.getenv("APPWRITE_COLLECTION_ID_OTP")
APPWRITE_DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID")
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# Initialize FastAPI app
# app = FastAPI()

client = Client()
client.set_endpoint(APPWRITE_API_ENDPOINT).set_project(APPWRITE_PROJECT_ID).set_key(
    APPWRITE_API_KEY
)

# origins = ["*"]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,  # Allow specific origins
#     allow_credentials=True,
#     allow_methods=["*"],  # Allow all HTTP methods (e.g., GET, POST)
#     allow_headers=["*"],  # Allow all headers
# )


database = Databases(client)


def send_email(email, otp, name):
    print("Creating message object...")
    msg = MIMEMultipart()
    msg["From"] = SMTP_EMAIL
    msg["To"] = email
    msg["Subject"] = "Your OTP Verification Code"
    message = f"""
    <h2>Hi {name},</h2>
    <p>Your OTP code is: <strong>{otp}</strong></p>
    <p>This code will expire in 5 minutes.</p>
    <p>If you didn't request this code, please ignore this email.</p>
    """
    msg.attach(MIMEText(message, "html"))
    print("Message object created.")

    print("Setting up mail server...")
    mailserver = smtplib.SMTP("smtp.gmail.com", 587)
    print("Mail server setup complete.")

    print("Securing email with TLS encryption...")
    mailserver.starttls()
    print("TLS encryption secured.")

    print("Logging into the mail server...")
    mailserver.login(SMTP_EMAIL, SMTP_PASSWORD)
    print("Login successful.")

    print("Sending email...")
    mailserver.sendmail(SMTP_EMAIL, email, msg.as_string())
    print("Email sent.")

    print("Quitting mail server...")
    mailserver.quit()
    print("Mail server quit.")

    print("Email sent to: ", email)
    return True


def hash_otp(otp):
    """Hashes the OTP using SHA-256."""
    return hashlib.sha256(otp.encode()).hexdigest()


def generate_otp(email: str, name: str):
    otp = f"{random.randint(10000, 99999)}"
    hashed_otp = hash_otp(otp)
    expiration = datetime.now() + timedelta(minutes=1)
    otp_document_id = str(uuid.uuid4())

    try:
        database.create_document(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=APPWRITE_COLLECTION_ID_OTP,
            document_id=otp_document_id,
            data={
                "otp": hashed_otp,
                "expires_at": expiration.isoformat(),
                "used": False,
                "email": email,
            },
        )
        send_email(email, otp, name)
        print("Document ID: ", otp_document_id)
        print("OTP: ", otp)
        print("Expiration: ", expiration)
        print("Email sent to: ", email)
        print("Name: ", name)

        return otp_document_id, otp
    except AppwriteException as e:
        print(f"Error creating document: {e.message}")
        raise HTTPException(status_code=500, detail="Failed to generate OTP")


def register_user(email, name):
    document = database.create_document(
        database_id=APPWRITE_DATABASE_ID,
        collection_id=APPWRITE_COLLECTION_ID_USERS,
        data={"email": email, "names": name},
        document_id=str(uuid.uuid4()),
    )
    print("User registered.")
    return document["$id"]


def check_user(email):
    document = database.list_documents(
        database_id=APPWRITE_DATABASE_ID,
        collection_id=APPWRITE_COLLECTION_ID_USERS,
        queries=[Query.equal("email", email)],
    )
    print("User checked.")

    # if email is present in the database, return false
    if len(document["documents"]) == 0:
        return False
    return document["documents"][0]["names"]


def verify_otp(email, otp, document_id):
    try:
        document = database.get_document(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=APPWRITE_COLLECTION_ID_OTP,
            document_id=document_id,
        )

        if document["email"] != email:
            print("Invalid email for the OTP")
            return False

        if document["used"]:
            print("OTP already used")
            # Delete the OTP as it has already been used
            database.delete_document(
                database_id=APPWRITE_DATABASE_ID,
                collection_id=APPWRITE_COLLECTION_ID_OTP,
                document_id=document_id,
            )
            return False

        expiration = parser.parse(document["expires_at"])
        current_time = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        print("Current time: ", current_time)
        print("Expiration: ", expiration)
        if expiration < current_time:
            print("OTP expired")
            database.delete_document(
                database_id=APPWRITE_DATABASE_ID,
                collection_id=APPWRITE_COLLECTION_ID_OTP,
                document_id=document_id,
            )
            return False

        if document["otp"] == hash_otp(otp):
            print("OTP verified")
            # Mark the OTP as used
            database.update_document(
                database_id=APPWRITE_DATABASE_ID,
                collection_id=APPWRITE_COLLECTION_ID_OTP,
                document_id=document_id,
                data={"used": True},
            )
            return True
        else:
            print("Invalid OTP")
            return False
    except AppwriteException as e:
        print(f"Error verifying OTP: {e.message}")
        raise HTTPException(status_code=500, detail="Failed to verify OTP")


def use_otp(otp, email, document_id):
    if verify_otp(email, otp, document_id):
        try:
            # Mark the OTP as used
            database.update_document(
                database_id=APPWRITE_DATABASE_ID,
                collection_id=APPWRITE_COLLECTION_ID_OTP,
                document_id=document_id,
                data={"used": True},
            )
            return True
        except AppwriteException as e:
            print(f"Error using OTP: {e.message}")
            raise HTTPException(status_code=500, detail="Failed to use OTP")
    return False

# function to resend OTP by deleting the old OTP and generating a new one
def resend_otp(email, name, document_id):
    try:
        database.delete_document(
            database_id=APPWRITE_DATABASE_ID,
            collection_id=APPWRITE_COLLECTION_ID_OTP,
            document_id=document_id
        )
        print("Old OTP deleted successfully.")
        otp_document_id, otp = generate_otp(email, name)
        return {"otp_document_id": otp_document_id, "otp": otp}
    except AppwriteException as e:
        print(f"Error resending OTP: {e.message}")
        raise HTTPException(status_code=500, detail="Failed to resend OTP")

