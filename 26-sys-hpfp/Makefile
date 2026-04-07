CC = gcc
TARGET = hw1
OBJECTS = hpfp.o hw1.o

$(TARGET) : hw1.o hpfp.o
	$(CC) -o $(TARGET) $(OBJECTS) -lm -g

hw1.o : hw1.c
	$(CC) -c -o hw1.o hw1.c -g

hpfp.o : hpfp.c
	$(CC) -c -o hpfp.o hpfp.c -g

clean :
	rm *.o $(TARGET)
