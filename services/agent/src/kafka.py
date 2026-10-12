from kafka import KafkaAdminClient , KafkaProducer , KafkaConsumer
import json

kafkaactive: bool = False
kafka_admin_client = KafkaAdminClient(
    bootstrap_servers='localhost:9092',
    client_id='my_client_id'
)


def  connect_kafka():
    global kafkaactive
    try:
        kafka_admin_client.list_topics()
        kafkaactive = True
        print("Kafka is connected and active.")
    except Exception as e:
        kafkaactive = False
        print(f"Failed to connect to Kafka: {e}")   



def connect_kafka_producer():
    global kafkaactive
    if not kafkaactive:
        print("Kafka is not active. Cannot create producer.")
        return None
    try:
        producer = KafkaProducer(
            bootstrap_servers='localhost:9092',
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        print("Kafka producer created successfully.")
        return producer
    except Exception as e:
        print(f"Failed to create Kafka producer: {e}")
        return None



def connect_kafka_consumer(topic):
    global kafkaactive
    if not kafkaactive:
        print("Kafka is not active. Cannot create consumer.")
        return None
    try:
        consumer = KafkaConsumer(
            topic,
            bootstrap_servers='localhost:9092',
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            group_id='my-group',
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        print(f"Kafka consumer created successfully for topic: {topic}.")
        return consumer
    except Exception as e:
        print(f"Failed to create Kafka consumer: {e}")
        return None


def disconnect_kafka():
    global kafkaactive
    try:
        kafka_admin_client.close()
        kafkaactive = False
        print("Kafka connection closed.")
    except Exception as e:
        print(f"Failed to close Kafka connection: {e}")
        kafkaactive = False
        return False
    return True









