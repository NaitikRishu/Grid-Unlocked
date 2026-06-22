FROM nikolaik/python-nodejs:python3.10-nodejs20

WORKDIR /app

# Install ML Python dependencies
COPY ml/requirements.txt ml/
RUN pip install --no-cache-dir -r ml/requirements.txt

# Install Node.js dependencies
COPY server/package*.json server/
RUN cd server && npm install

# Copy application code
COPY ml/ ml/
COPY server/ server/

# Build graph during image construction
RUN python ml/src/build_graph.py

# Setup unified execution script
COPY start.sh start.sh
RUN chmod +x start.sh

# Hugging Face Spaces routes external traffic to 7860
EXPOSE 7860

CMD ["./start.sh"]
