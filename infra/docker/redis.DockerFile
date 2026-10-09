FROM redis:7.2-alpine

# Copy custom configuration file into the container
COPY redis.conf /usr/local/etc/redis/redis.conf

# Expose the default Redis port
EXPOSE 6379

# Run Redis using the custom configuration file
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]