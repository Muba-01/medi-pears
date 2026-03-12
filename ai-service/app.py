from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from nltk.stem import PorterStemmer
import numpy as np

app = Flask(__name__)
CORS(app)
clf = joblib.load('rf_model.joblib')
tfidf = joblib.load('tfidf_vectorizer.joblib')
selector = joblib.load('feature_selector.joblib')
stemmer = PorterStemmer()
analyzer = SentimentIntensityAnalyzer()

def has_valid_reference(text):
    patterns = [r'https?://', r'www\.', r'\[?\d+\]?', r'according to', r'sources?', r'references?']
    return int(any(re.search(pat, text, re.IGNORECASE) for pat in patterns))
def is_timely(text):
    return int(bool(re.search(r'\b(20[1-2][5-9]|202[0-5])\b', text)))
def is_pubmed_reference(text):
    return int('pubmed.ncbi.nlm.nih.gov' in text.lower() or 'doi.org' in text.lower())

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        text = data.get('text', '')
        stemmed_text = ' '.join([stemmer.stem(word) for word in str(text).split()])
        X_tfidf = tfidf.transform([stemmed_text])
        X_selected = selector.transform(X_tfidf)
        ml_pred = clf.predict(X_selected)[0]
        ml_conf = clf.predict_proba(X_selected)[0][1]
        ref = has_valid_reference(text)
        timely = is_timely(text)
        pubmed = is_pubmed_reference(text)
        trust_index = round((ml_conf + ref + timely + pubmed) / 4, 2)
        if trust_index >= 0.75:
            message = "High trust score! This article appears reliable."
        else:
            message = "Low trust score. This article may need further verification."
        return jsonify({
            'trust_index': trust_index,
            'message': message
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
