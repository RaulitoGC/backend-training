import {EventEmitter, errorMonitor} from "events";

class BusinessRegistrationManager  extends EventEmitter{

    public static readonly BUSINESS_REGISTERED_EVENT : string = 'businessRegistered'
    private static readonly BUSINESS_REGISTRATION_ERROR_EVENT : string = 'registrationError'

    constructor() {
        super();
        this.init();
    }

    private init(){
        this.on(BusinessRegistrationManager.BUSINESS_REGISTERED_EVENT, (businessData) => {
            console.log("Sending Welcome email")
            console.log("new business account registered")
        })

        this.on(errorMonitor, (err) => {
            console.log("Business Registration Error")
        })
    }
    public businessRegistered(businessData: String) {
        this.emit(BusinessRegistrationManager.BUSINESS_REGISTERED_EVENT, businessData);
    }

}

export default BusinessRegistrationManager;