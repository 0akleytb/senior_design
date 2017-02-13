/******* 
 *  DAQ Software to Monitor Brake Performance of Vehicle
 *  Author : FDP Senior Design Team
 *  2017
 *******/

#include <SPI.h>
#include <SD.h>
#include <Adafruit_GPS.h>
#include <Adafruit_GFX.h>
#include <Adafruit_TFTLCD.h>
#include <TouchScreen.h>

// TouchScreen Pins
#define YP A5
#define XM A4
#define YM 31
#define XP 30

// LCD Analog Pins
#define LCD_CS A3
#define LCD_CD A2
#define LCD_WR A1
#define LCD_RD A0
#define LCD_RESET A6

// Hardware Serialport
#define GPSSerial Serial1
#define Dir "Datalogging"

/*******
 * Set GPSECHO to 'false' to turn off echoing the GPS data to the Serial console 
 * Set to 'true' if you want to debug and listen to the raw GPS sentences. 
 *******/
#define GPSECHO  false



// TouchScreen Bounds
#define TS_MINX 150
#define TS_MINY 120
#define TS_MAXX 920
#define TS_MAXY 940

// TouchScreen Parameters
#define MINPRESSURE 10
#define MAXPRESSURE 1000

#define BUFFMAX 4

// LCD Sizes
#define TFTWIDTH   480
#define TFTHEIGHT  320

// LCD Text Sizes
#define HEADTEXT 3          // text-size to be used for headers & display data

// LCD Element Sizes
#define BOXSIZE 40
#define BOXWIDE 160
#define BOXHIGH 120
#define PENRADIUS 3
#define DATAWIDE HEADTEXT*6 // width of a single character of header text
#define DATAHIGH HEADTEXT*8 // height of a single character of header text
#define FRAMESIZE 5        // width of the frame around the Squeal button

// LCD Colors
#define BLACK   0x0000
#define BLUE    0x001F
#define RED     0xF800
#define GREEN   0x07E0
#define CYAN    0x07FF
#define MAGENTA 0xF81F
#define YELLOW  0xFFE0
#define WHITE   0xFFFF
#define GRAY    0x7BEF
#define LITEGRAY 0xC618
#define DARKGRAY 0x39E7

#define BACKCOLOR WHITE
#define TESTCOLOR BLUE




class tsbutton {
  private:
    bool* buffpoint;
    bool buttbuff[BUFFMAX];
    bool ispressed;
    bool waspressed;

  public:
    tsbutton();
    ~tsbutton();
    bool buttonPress(bool);
    bool isPressed();
    bool wasJustPressed();
    bool wasJustReleased();
};




// GLOBALS //
TouchScreen ts = TouchScreen(XP, YP, XM, YM, 258);
Adafruit_TFTLCD tft(LCD_CS, LCD_CD, LCD_WR, LCD_RD, LCD_RESET);
int dummyval = 1234;
bool logging = false, isSqueal = false, wasSqueal = false;
tsbutton startButton, squealButton;

// Connect to the GPS on hardware serial
Adafruit_GPS GPS(&GPSSerial);

/*******
 * this keeps track of whether we're using the interrupt
 * off by default!
 *******/

boolean usingInterrupt = false;

/* Pin number corresponding to Chip Select */
const int chipSelect = 53;
String fileName = "datalog0.csv";
const String dtlog = "datalog";
const String ext = ".csv";
int count = 0;
File dataFile;
uint32_t timer = millis();




// PROTOTYPES //
void useInterrupt(boolean v);




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




// **** **** **** **** //
//                     //
//     MAIN PROGRAM    //
//                     //
// **** **** **** **** //

void setup() {

  // **** Main Branch Set-up Code ****
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
       count++;
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
    //Serial.print("\n This part was not skipped");
    
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


  // **** Display Branch Set-up Code ****
  tft.reset();
  uint16_t identifier = tft.readID();

  if ((identifier == 0x9325) || (identifier == 0x9328) || (identifier == 0x7575) || (identifier == 0x9341) || (identifier == 0x8357))
    tft.begin(identifier);
  else
    return;

  tft.fillScreen(BACKCOLOR);
  tft.setRotation(1);
  writeHeaderText();
  drawFrame();
  drawButtons();
}


void loop() {
  
  TSPoint p = ts.getPoint();
  int coord;



  // **** Main Branch Loop Code ****
  
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



  // **** Display Branch Loop Code ****
  
  if (MINPRESSURE < p.z && p.z < MAXPRESSURE) {
    coord = map(p.y, TS_MAXY, TS_MINY, 0, TFTWIDTH);
    p.y = map(p.x, TS_MINX, TS_MAXX, 0, TFTHEIGHT);
    p.x = coord;
    
    if (p.x > (TFTWIDTH - BOXWIDE)) { // **** button pressed ****
      if (p.y < BOXHIGH) { // **** start/stop button ****
        if (startButton.buttonPress(true) && startButton.wasJustPressed()) {
          logging = !logging;
          drawButtons();
          delay(250); // **** debounce start/stop button ****
        }
        squealButton.buttonPress(false);
      } else if ((p.y >= BOXHIGH) && logging) { // **** squeal button pressed, while data-logging ****
        startButton.buttonPress(false);
        squealButton.buttonPress(true);
      } else { // **** squeal button pressed, while NOT data-logging ****
        startButton.buttonPress(false);
        squealButton.buttonPress(false);
        updateDisplay();
      }
    } else { // **** NO BUTTON PRESSED ****
      startButton.buttonPress(false);
      squealButton.buttonPress(false);
    }
  } else {
    startButton.buttonPress(false);
    squealButton.buttonPress(false);
  }
  
  /*
  isSqueal = squealButton.isPressed();
  // **** Draw a square in the bottom right of the display to indicate squeal has started ****
  // **** >> erase when squeal has ended, and ignore otherwise ****
  if (isSqueal && !wasSqueal) {
    tft.fillRect(TFTWIDTH - BOXSIZE, TFTHEIGHT - BOXSIZE, TFTWIDTH, TFTHEIGHT, TESTCOLOR);
  } else if (wasSqueal && ! isSqueal) {
    tft.fillRect(TFTWIDTH - BOXSIZE, TFTHEIGHT - BOXSIZE, TFTWIDTH, TFTHEIGHT, BACKCOLOR);
  }
  wasSqueal = isSqueal;
  */
  
  if (squealButton.wasJustPressed()) {
    drawSquealButton();
    isSqueal = true;
  } else if (squealButton.wasJustReleased()) {
    drawSquealButton();
    isSqueal = false;
  }
  

}



// **** **** **** **** //
//                     //
//   UNCLASSED  FXNS   //
//                     //
// **** **** **** **** //

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

// **** Fxn responsible for (re)drawing Start/Stop button ****
void drawButtons() {
  tft.setTextSize(4);
  tft.setCursor(TFTWIDTH - BOXWIDE + 20, 40);
  if (logging) {
    tft.fillRect(TFTWIDTH - BOXWIDE, 0, BOXWIDE, BOXHIGH, RED);
    tft.setTextColor(WHITE);
    tft.print("Stop");
  } else {
    tft.fillRect(TFTWIDTH - BOXWIDE, 0, BOXWIDE, BOXHIGH, GREEN);
    tft.setTextColor(BLACK);
    tft.print("Start");
  }
  drawSquealButton();
}

// **** Fxn responsible for drawing frame around Squeal/Squealing button ****
void drawFrame() {
  tft.fillRect(TFTWIDTH - BOXWIDE, BOXHIGH - 1, BOXWIDE, TFTHEIGHT + 1, DARKGRAY);
}

// **** Fxn responsible for (re)drawing Squeal/Squealing button ****
void drawSquealButton() {
  int squealboxcolor;
  int squealtextcolor;
  tft.setTextSize(3);
  tft.setCursor(TFTWIDTH - BOXWIDE + 25, 200);
  tft.setTextColor(DARKGRAY);
  if (logging) {
    if (squealButton.isPressed()) {
      squealboxcolor = GRAY;
    } else {
      squealboxcolor = LITEGRAY;
    }
  } else {
    squealboxcolor = DARKGRAY;
  }
  tft.fillRect(TFTWIDTH - BOXWIDE + FRAMESIZE, BOXHIGH + FRAMESIZE, BOXWIDE - (2*FRAMESIZE), TFTHEIGHT - BOXHIGH - (2*FRAMESIZE), squealboxcolor);
  tft.print("Squeal");
}

// **** Fxn responsible for updating display with most recent/relevant Pressure value ****
void updatePressureDisplay() {
  tft.setCursor(10 + (DATAWIDE * 9), 8 + (DATAHIGH * 0));
  tft.fillRect(10 + (DATAWIDE * 9), 8 + (DATAHIGH * 0), 8 * DATAWIDE, DATAHIGH, BACKCOLOR);
  tft.print(dummyval, DEC); dummyval++;
}

// **** Fxn responsible for updating display with most recent/relevant GPS data ****
void updateGPSDisplay() {
  tft.setCursor(10 + (DATAWIDE * 9), 8 + (DATAHIGH * 2));
  tft.fillRect(10 + (DATAWIDE * 9), 8 + (DATAHIGH * 2), 8 * DATAWIDE, 2 * DATAHIGH, BACKCOLOR);
  tft.print(dummyval, DEC); dummyval++;
  tft.setCursor(10 + (DATAWIDE * 9), 8 + (DATAHIGH * 3));
  tft.print(dummyval, DEC); dummyval++;
}

// **** Fxn responsible for updating display with most recent/relevant Temperature values ****
void updateThermoDisplay() {
  tft.fillRect(10 + (DATAWIDE * 3), 8 + (DATAHIGH * 8), 8 * DATAWIDE, 2 * DATAHIGH, BACKCOLOR);
  tft.fillRect((TFTWIDTH / 2) + 10 - 80 + (DATAWIDE * 3), 8 + (DATAHIGH * 8), 8 * DATAWIDE, 2 * DATAHIGH, BACKCOLOR);
  tft.setCursor(10 + (DATAWIDE * 3), 8 + (DATAHIGH * 8));
  tft.print(dummyval, DEC); dummyval++;
  tft.setCursor(10 + (DATAWIDE * 3), 8 + (DATAHIGH * 9));
  tft.print(dummyval, DEC); dummyval++;
  tft.setCursor((TFTWIDTH / 2) + 10 - 80 + (DATAWIDE * 3), 8 + (DATAHIGH * 8));
  tft.print(dummyval); dummyval++;
  tft.setCursor((TFTWIDTH / 2) + 10 - 80 + (DATAWIDE * 3), 8 + (DATAHIGH * 9));
  tft.print(dummyval); dummyval++;
}

// **** Fxn responsible for updating display with most recent/relevant Pressure, Temperature, and GPS data ****
void updateDisplay() {

  tft.setTextColor(BLACK);
  tft.setTextSize(HEADTEXT);

  //updatePressureDisplay();
  updateGPSDisplay();
  //updateThermoDisplay();

}

// **** Fxn responsible for writing headers (e.g. "Pressure:" and "Thermocouples:") to the display ****
void writeHeaderText() {
  tft.setTextColor(BLACK);
  tft.setTextSize(HEADTEXT);

  tft.setCursor(10, 8 + (8 * HEADTEXT * 0)); // **** NOTE: a line's size is given by textsize*8 (per Adafruit_GFX library) ****
  tft.print("Pressure:");            // **** >> use of HEADTEXT to determine where to draw text based on text size ****


  tft.setCursor(10, 8 + (8 * HEADTEXT * 2));
  tft.print("GPS  lat:");
  tft.setCursor(10, 8 + (8 * HEADTEXT * 3));
  tft.print("GPS long:");


  tft.setCursor(10, 8 + (8 * HEADTEXT * 6));
  tft.print("Thermocouples:");

  tft.setCursor(10, 8 + (8 * HEADTEXT * 8));
  tft.print("1:");
  tft.setCursor(10, 8 + (8 * HEADTEXT * 9));
  tft.print("2:");
  tft.setCursor((TFTWIDTH / 2) + 10 - 80, 8 + (8 * HEADTEXT * 8));
  tft.print("3:");
  tft.setCursor((TFTWIDTH / 2) + 10 - 80, 8 + (8 * HEADTEXT * 9));
  tft.print("4:");

}



// **** **** **** **** //
//                     //
//    CLASSED  FXNS    //
//                     //
// **** **** **** **** //

tsbutton::tsbutton(void) {
  buffpoint = buttbuff;
  for (int i = 0; i < BUFFMAX; i++) {
    buttbuff[i] = false;
  }
  ispressed = false;
}

tsbutton::~tsbutton(void) {

}

bool tsbutton::buttonPress(bool bval) {
  *buffpoint = bval;
  buffpoint = ((buffpoint - buttbuff + 1) % BUFFMAX) + buttbuff;
  return isPressed();
}

bool tsbutton::isPressed(void) {
  waspressed = ispressed;
  if (!ispressed) {
    ispressed = true;
    for(int i = 0; i < BUFFMAX; i++) {
      ispressed &= buttbuff[i];
    }
  } else if (ispressed) {
    ispressed = false;
    for(int i = 0; i < BUFFMAX; i++) {
      ispressed |= buttbuff[i];
    }
  }
  return ispressed;
}

bool tsbutton::wasJustPressed(void) {
  bool bval = (ispressed && !waspressed);
  //waspressed = ispressed;
  return bval;
}
/* */
float VoltToTempConv(int sensorValue)
{
   // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 5V):
  float voltage = sensorValue * (5.0 / 1023.0);
  // Convert the voltage to temperature
  float temp = (voltage - 1.25)/(0.005);

  return temp;
    
}


bool tsbutton::wasJustReleased(void) {
  //Serial.print("\n isp:"); Serial.print(ispressed);
  //Serial.print("\nwasp:"); Serial.print(waspressed);
  bool bval = (!ispressed && waspressed);
  //waspressed = ispressed;
  //Serial.print("\nnwsp:"); Serial.print(waspressed);
  return bval;
}

