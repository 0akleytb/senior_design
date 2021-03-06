#include <Adafruit_GFX.h>
#include <Adafruit_TFTLCD.h>
#include <TouchScreen.h>

#define YP A5
#define XM A4
#define YM 31
#define XP 30

#define LCD_CS A3
#define LCD_CD A2
#define LCD_WR A1
#define LCD_RD A0
#define LCD_RESET A6

#define TS_MINX 150
#define TS_MINY 120
#define TS_MAXX 920
#define TS_MAXY 940

#define TFTWIDTH   480
#define TFTHEIGHT  320

#define HEADTEXT 3          // text-size to be used for headers & display data

#define BOXSIZE 40
#define BOXWIDE 160
#define BOXHIGH 120
#define PENRADIUS 3
#define DATAWIDE HEADTEXT*6 // width of a single character of header text
#define DATAHIGH HEADTEXT*8 // height of a single character of header text
#define FRAMESIZE 5        // width of the frame around the Squeal button

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

#define MINPRESSURE 10
#define MAXPRESSURE 1000

#define BUFFMAX 4

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


// **** **** **** **** //
//                     //
//     MAIN PROGRAM    //
//                     //
// **** **** **** **** //

void setup() {
  tft.reset();
  uint16_t identifier = tft.readID();

  //  if(identifier == 0x9325) {
  //    Serial.println(F("Found ILI9325 LCD driver"));
  //  } else if(identifier == 0x9328) {
  //    Serial.println(F("Found ILI9328 LCD driver"));
  //  } else if(identifier == 0x7575) {
  //    Serial.println(F("Found HX8347G LCD driver"));
  //  } else if(identifier == 0x9341) {
  //    Serial.println(F("Found ILI9341 LCD driver"));
  //  } else if(identifier == 0x8357) {
  //    Serial.println(F("Found HX8357D LCD driver"));
  //  } else {
  //    Serial.print(F("Unknown LCD driver chip: "));
  //    Serial.println(identifier, HEX);
  //    Serial.println(F("If using the Adafruit 2.8\" TFT Arduino shield, the line:"));
  //    Serial.println(F("  #define USE_ADAFRUIT_SHIELD_PINOUT"));
  //    Serial.println(F("should appear in the library header (Adafruit_TFT.h)."));
  //    Serial.println(F("If using the breakout board, it should NOT be #defined!"));
  //    Serial.println(F("Also if using the breakout, double-check that all wiring"));
  //    Serial.println(F("matches the tutorial."));
  //    return;
  //  }

  if ((identifier == 0x9325) || (identifier == 0x9328) || (identifier == 0x7575) || (identifier == 0x9341) || (identifier == 0x8357))
    tft.begin(identifier);
  else
    return;

  tft.fillScreen(BACKCOLOR);
  tft.setRotation(1);
  writeHeaderText();
  drawFrame();
  drawButtons();
  Serial.begin(9600);
}

void loop() {
  TSPoint p = ts.getPoint();
  int coord;

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

bool tsbutton::wasJustReleased(void) {
  //Serial.print("\n isp:"); Serial.print(ispressed);
  //Serial.print("\nwasp:"); Serial.print(waspressed);
  bool bval = (!ispressed && waspressed);
  //waspressed = ispressed;
  //Serial.print("\nnwsp:"); Serial.print(waspressed);
  return bval;
}

