/******* 
 *  DAQ Software to Monitor Brake Performance of Vehicle
 *  Author : FDP Senior Design Team
 *  2017
 *******/

#include <Adafruit_GPS.h>
#include <SPI.h>
#include <SD.h>


// Hardware Seialport
#define GPSSerial Serial1
#define Dir "Datalogging"


// Connect to the GPS on hardware serial
Adafruit_GPS GPS(&GPSSerial);

/*******
 * Set GPSECHO to 'false' to turn off echoing the GPS data to the Serial console 
 * Set to 'true' if you want to debug and listen to the raw GPS sentences. 
 *******/
#define GPSECHO  false

/*******
 * this keeps track of whether we're using the interrupt
 * off by default!
 *******/

 boolean usingInterrupt = false;
 void useInterrupt(boolean);
 
/* Pin number corresponding to Chip Select */
const int chipSelect = 53;
String fileName = "datalog0.csv";
const String dtlog = "datalog";
const String ext = ".csv";
int count = 0;
File dataFile;

void setup() 
{
  /* Set Serial Baud Rate to 115200 for GPS reads, com[uter & Arduino connection */
  Serial.begin(9600); 

  //wait for established connection between arduino & GPS
  while (!Serial1) 
  {
    ; // wait for serial port to connect. Needed for native USB port only
  }
  /* 9600 default baud rate for GPS */
  GPS.begin(9600);

  /* Enable RMC (Reccommeded Minimum Data - position, velocity, and time) and GGA (fix data) including altitude */
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);

  /* Set the update rate to 1 Hz */
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);

  /* Request updates on antenna status, comment out to keep quiet */
  GPS.sendCommand(PGCMD_ANTENNA);

  Serial.print("Initializing SD card...");

  /* check if the card is present and can be initialized: */
  if (!SD.begin(chipSelect))
  {
    Serial.println("Card failed, or not present");
   // don't do anything more:
    return;
  }
  Serial.println("card initialized.");

//  // If no Directory, one will be created
//  if(!SD.exists(Dir))
//  {
//    SD.mkdir(Dir);
//  }

  
    
  while (SD.exists(fileName))
   {
       fileName = dtlog;
       count += 1;
       fileName += count;
       fileName += ext; 
   }


  dataFile = SD.open(fileName, FILE_WRITE);

  if(dataFile){
  Serial.println("datalog.csv opened successfully");}
  else{
  Serial.println("error opening datalog.csv");}
 

  /*if the file is available, write to it: */
  if (dataFile) 
  {
    dataFile.println("This is a test");
    Serial.print("\n This part was not skipped");
    
    dataFile.print("Hour, Minute, Second, milliseconds, Day, Month, year");
    dataFile.print("Fix, Quality, Latitude, Longitude, Latitude (Degrees),");
    dataFile.print("Longitude (Degrees), Speed (knots), Angle, Altitude, Satelites \n");
    dataFile.close();

  }
  /********
   * Set timer0 interrupt to go off every 1 millisecond and read data from GPS
   ********/
  useInterrupt(true);

  delay(1000);
}

/*  Interrupt Handler for Timer Interrupt vector "TIMER0_COMPA_vect"
 *  Interrupt is called once a millisecond, looks for any new GPS data, and stores it
 */
SIGNAL(TIMER0_COMPA_vect) {
  char c = GPS.read();
  
#ifdef UDR0
  if (GPSECHO)
    if (c) UDR0 = c;  
    /* write byte directly to UDR0 (UART Data Register)*/ 
#endif
}

void useInterrupt(boolean v) {
  if (v) {
    /*  Timer0 is already used for millis() - Generate interrupt whenever 
     *  the counter value passes 0xAF, and call the "Compare A" function below
     */
    OCR0A = 0xAF;
    TIMSK0 |= _BV(OCIE0A);
    usingInterrupt = true;
  } else {
    /* Do not call the interrupt function COMPA anymore */
    TIMSK0 &= ~_BV(OCIE0A);
    usingInterrupt = false;
  }
}

uint32_t timer = millis();

/* Print GPS Data to Serial Console every 2 seconds */
void PrintToConsole()
{
  
  if (millis() - timer > 2000) 
  { 
    timer = millis(); // reset the timer
    
    Serial.print("\nTime: ");
    Serial.print(GPS.hour, DEC); Serial.print(':');
    Serial.print(GPS.minute, DEC); Serial.print(':');
    Serial.print(GPS.seconds, DEC); Serial.print('.');
    Serial.println(GPS.milliseconds);
    Serial.print("Date: ");
    Serial.print(GPS.day, DEC); Serial.print('/');
    Serial.print(GPS.month, DEC); Serial.print("/20");
    Serial.println(GPS.year, DEC);
    Serial.print("Fix: "); Serial.print((int)GPS.fix);
    Serial.print(" quality: "); Serial.println((int)GPS.fixquality); 
    if (GPS.fix) {
      Serial.print("Location: ");
      Serial.print(GPS.latitude, 4); Serial.print(GPS.lat);
      Serial.print(", "); 
      Serial.print(GPS.longitude, 4); Serial.println(GPS.lon);
      Serial.print("Location (in degrees, works with Google Maps): ");
      Serial.print(GPS.latitudeDegrees, 4);
      Serial.print(", "); 
      Serial.println(GPS.longitudeDegrees, 4);
      
      Serial.print("Speed (knots): "); Serial.println(GPS.speed);
      Serial.print("Angle: "); Serial.println(GPS.angle);
      Serial.print("Altitude: "); Serial.println(GPS.altitude);
      Serial.print("Satellites: "); Serial.println((int)GPS.satellites);
    }
  }
}

void loop() 
{
  /* if a sentence is received, we can check the checksum, parse it... */
  if (GPS.newNMEAreceived())
  {
      if (!GPS.parse(GPS.lastNMEA()))   // this also sets the newNMEAreceived() flag to false
         ;// return;  // we can fail to parse a sentence in which case we should just wait for another
  }

  // if millis() or timer wraps around, we'll just reset it
  if (timer > millis())  timer = millis();
  
  /* Approximately every 2 seconds or so, print out the current stats */
  PrintToConsole();

  /* open the file. note that only one file can be open at a time,
   *  so you have to close this one before opening another.
   */

    dataFile = SD.open(fileName, FILE_WRITE);
    dataFile.print(GPS.hour); dataFile.print(",");
    dataFile.print(GPS.minute);dataFile.print(",");
    dataFile.print(GPS.seconds, DEC); dataFile.print(",");
    dataFile.print(GPS.milliseconds);dataFile.print(",");
    dataFile.print(GPS.day, DEC); dataFile.print(",");
    dataFile.print(GPS.month, DEC); dataFile.print(",");
    dataFile.print(GPS.year, DEC);dataFile.print(",");
    dataFile.print((int)GPS.fix);dataFile.print(",");
    dataFile.print((int)GPS.fixquality); dataFile.print(",");
    dataFile.print(GPS.latitude, 4); dataFile.print(",");
    dataFile.print(GPS.lat);dataFile.print(",");
    dataFile.print(GPS.longitude, 4);dataFile.print(",");
    dataFile.print(GPS.lon);dataFile.print(",");
    dataFile.print(GPS.latitudeDegrees, 4);dataFile.print(",");
    dataFile.print(", "); dataFile.print(",");
    dataFile.print(GPS.longitudeDegrees, 4);  dataFile.print(",");   
    dataFile.print(GPS.speed);dataFile.print(",");
    dataFile.print(GPS.angle);dataFile.print(",");
    dataFile.print(GPS.altitude);dataFile.print(",");
    dataFile.print((int)GPS.satellites);dataFile.print(",");
    dataFile.print("\n");
    dataFile.close();
    
  
}
