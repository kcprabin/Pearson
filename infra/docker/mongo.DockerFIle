FROM mongo:7.0

# Copy a custom configuration file into the container
COPY mongod.conf /etc/mongod.conf

# (Optional) Copy custom initialization scripts into the initdb directory 
# Any .js or .sh scripts placed here will run automatically on first startup
# COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# Expose the default MongoDB port
EXPOSE 27017

# Start MongoDB with the custom configuration
CMD ["mongod", "--config", "/etc/mongod.conf"]