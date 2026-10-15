from kafka import KafkaAdminClient , KafkaProducer , KafkaConsumer
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
import json
from typing import Any

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



def connect_kafka_consumer(
    topic,
    group_id: str = "pearson-agent",
    max_records: int = 100,
):
    global kafkaactive
    if not kafkaactive:
        print("Kafka is not active. Cannot create consumer.")
        return None
    try:
        consumer = KafkaConsumer(
            topic,
            bootstrap_servers='localhost:9092',
            auto_offset_reset='earliest',
            enable_auto_commit=False,
            group_id=group_id,
            max_poll_records=max_records,
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        print(f"Kafka consumer created successfully for topic: {topic}.")
        return consumer
    except Exception as e:
        print(f"Failed to create Kafka consumer: {e}")
        return None


def consume_messages(
    topic: str,
    handler: Callable[[Any], None],
    group_id: str = "pearson-agent",
    max_workers: int = 10,
    batch_size: int = 100,
) -> None:
    """Process Kafka messages concurrently in bounded, manually committed batches."""
    if not kafkaactive:
        connect_kafka()

    consumer = connect_kafka_consumer(topic, group_id, batch_size)
    if consumer is None:
        return

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        while True:
            records = consumer.poll(timeout_ms=1000, max_records=batch_size)
            events = [event for partition in records.values() for event in partition]
            if not events:
                continue

            futures = [executor.submit(handler, event.value) for event in events]
            for future in futures:
                future.result()

            consumer.commit()


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









