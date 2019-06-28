import { Component, NgZone } from '@angular/core';
import { Platform, NavController } from '@ionic/angular';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx'
import { FormGroup, FormBuilder, FormControl, Validators,ReactiveFormsModule } from '@angular/forms';
import DB from "../Rooms.json";

declare var ApiAIPromises: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  answer;
  query;
  bgcolor: string = 'blue';
  public myForm: FormGroup;
  public Rooms = [];

  constructor(public platform: Platform, public ngZone: NgZone,public navCtrl: NavController,private tts: TextToSpeech,public formBuilder: FormBuilder) {
    platform.ready().then(() => {
      this.myForm = formBuilder.group({
        //room1: ['', Validators.required]
      });
      //Currently only using APIAIPromises for straightforward query > response
      //Change clientAccessToken if you have your own DialogFlow Instance for testing
      ApiAIPromises.init({
        clientAccessToken: "e4aafe0b48b541da9d4ef7d3c759d76b"
      }).then(result => console.log(result));
      SpeechRecognition.hasPermission().then((hasPermission: boolean) => {
        if(!hasPermission){
          SpeechRecognition.requestPermission().then(
            () => console.log('Granted'),
            () => console.log('Denied')
          )
        }
      })
    })
  }
  //Triggers the Speech to Text function
  start(){
    SpeechRecognition.startListening({showPopup:false}).subscribe(
      (matches: string[] = []) => {
        this.query = matches[0];
        this.ask(matches[0]);
      },
      (onerror) => console.log('error:',onerror)
    )
  }
  //Triggers DialogFlow response query
  //Currently only returns fulfillment text of triggered instance
  ask(question){
    ApiAIPromises.requestText({
      query:question
    }).then((result) => {
      this.ngZone.run(() => {
        var res = result;
          switch(res.result.metadata.intentName){
          case 'Search':{
          this.answer = res.result.fulfillment.speech;
          this.speak(res.result.fulfillment.speech);
            if(typeof(res.result.parameters.Date) != "undefined"&&typeof(res.result.parameters.Floor)!= "undefined")
            this.search(res.result.parameters.Date,res.result.parameters.Floor);
          }          
            break;
         default:
          this.answer = res.result.fulfillment.speech;
          this.speak(res.result.fulfillment.speech);
      }
        
      });
    })
  }
  //Triggers the Text to Speech function
  speak(phrase){
    this.tts.speak(phrase);
  }

  
  //Search Function
  search(dTime,floor)
  {
    this.answer = "Here are the list of rooms available at "+floor+" on "+ dTime;
    this.speak("Here are the list of rooms available at "+floor+" on "+ dTime);
    var Hold=DB;
    var obj;
     for(var i = 0; i < Hold.rooms.length; i++) {
      obj = Hold.rooms[i];
      if(obj.floor.toLowerCase() == floor.toLowerCase()){
        try{
          console.log(obj.name);
          this.Rooms.push(obj.name);
        }
        catch(e){
          console.log(e);
        }
      }
      
    }
  }
}
