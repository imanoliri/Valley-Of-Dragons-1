import os
import pandas as pd
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from .env file
load_dotenv()

# Load Firebase credentials from environment variables
firebase_project_id = os.getenv("FIREBASE_PROJECT_ID")
firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n")
firebase_client_email = os.getenv("FIREBASE_CLIENT_EMAIL")

# Create a credentials object from the environment variables
cred = credentials.Certificate(
    {
        "type": "service_account",
        "project_id": firebase_project_id,
        "private_key": firebase_private_key,
        "client_email": firebase_client_email,
        "token_uri": "https://oauth2.googleapis.com/token",
    }
)

# Initialize the Firebase app if not already initialized
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

# Use the Firestore client from firebase_admin
db = (
    firestore.client()
)  # Correctly initialize the Firestore client using firebase_admin


# Download feedback data from Firestore
def download_feedback_data():
    feedback_collection = db.collection("feedback")
    feedback_docs = feedback_collection.stream()

    # Extract data into a list of dictionaries
    feedback_list = []
    for doc in feedback_docs:
        feedback = doc.to_dict()
        feedback_list.append(feedback)

    return feedback_list


def feedback_to_frames(feedback) -> pd.DataFrame:
    df = pd.DataFrame.from_records(feedback)
    df["date"] = df["date"].astype("datetime64[ns, UTC]")
    df = df.sort_values(by=["storyID", "chapter", "userName", "date"])
    df = df.set_index(["storyID", "chapter", "userName", "date"])
    return frame_from_records_column(df, "ratings"), frame_from_records_column(
        df, "comments"
    )


def frame_from_records_column(df, column) -> pd.DataFrame:
    df_col = pd.DataFrame.from_records(df.loc[:, column].values)
    df_col.index = df.index
    return df_col


# Main function
if __name__ == "__main__":
    feedback_data = download_feedback_data()
    df_ratings, df_comments = feedback_to_frames(feedback_data)
    df_ratings.to_csv("feedback_ratings.csv", index=False)
    df_comments.to_csv("feedback_comments.csv", index=False)
