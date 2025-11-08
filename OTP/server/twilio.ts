import twilio from 'twilio';
const { jwt } = twilio;

// Twilio credentials must come from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Generate a Twilio Voice Access Token for making outbound calls
 * @param identity The user identity (usually username or ID)
 * @returns Access token string
 */
export function generateTwilioToken(identity: string): string {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error('Missing Twilio credentials. Please check environment variables.');
  }

  try {
    console.log(`Generating Twilio token for identity: ${identity}`);
    
    // Create a properly typed Twilio AccessToken
    const AccessToken = twilio.jwt.AccessToken;
    // TwiML App SID must be provided via env vars
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
    if (!twimlAppSid) {
      throw new Error('Missing TWILIO_TWIML_APP_SID environment variable.');
    }
    
    // Create an access token with specified identity
    // Pass the identity in both places to ensure it's properly set
    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      identity,
      { identity: identity } // Required option for proper token generation
    );
    
    // Set TTL to 1 hour
    token.ttl = 3600;
    
    // Add Voice Grant to the token
    const voiceGrant = new AccessToken.VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true
    });
    
    token.addGrant(voiceGrant);
    
    // Generate and return the token
    const tokenString = token.toJwt();
    console.log(`Successfully generated token for ${identity}`);
    
    return tokenString;
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    throw new Error('Failed to generate Twilio token: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Creates a TwiML response for making outbound calls
 * @param toNumber The phone number to call
 * @returns TwiML string
 */
export function createVoiceResponse(toNumber: string): string {
  const { VoiceResponse } = twilio.twiml;
  const response = new VoiceResponse();
  
  try {
    // Ensure phone number is in E.164 format
    let formattedNumber = toNumber;
    if (!toNumber.startsWith('+')) {
      // If number doesn't start with +, assume US and add +1
      if (toNumber.startsWith('1')) {
        formattedNumber = `+${toNumber}`;
      } else {
        formattedNumber = `+1${toNumber}`;
      }
    }
    
    console.log(`Creating TwiML response for outbound call to ${formattedNumber}`);
    
    // Create a dial instruction to the specified number
    const dial = response.dial({
      callerId: TWILIO_PHONE_NUMBER, // This will be shown on the recipient's caller ID
      timeout: 20, // 20 seconds ring time before giving up
      answerOnBridge: true, // Wait until the call is answered before connecting
      record: 'record-from-answer' // Record the call after it's answered
    });
    
    // Add the number to dial
    dial.number(formattedNumber);
    
    const twiml = response.toString();
    console.log(`Generated TwiML: ${twiml}`);
    console.log(`Created TwiML response for call to ${formattedNumber}`);
  } catch (error) {
    console.error('Error creating TwiML response:', error);
    response.say('Sorry, there was an error making your call. Please try again later.');
  }
  
  return response.toString();
}

/**
 * Get the Twilio client instance
 * @returns Twilio client
 */
export function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Missing Twilio credentials. Please check environment variables.');
  }
  
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}