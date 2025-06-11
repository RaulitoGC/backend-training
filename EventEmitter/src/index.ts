
import BusinessRegistrationManager from "./BusinessRegistrationManager";

const businessRegistrationManager = new BusinessRegistrationManager();

businessRegistrationManager.emit(BusinessRegistrationManager.BUSINESS_REGISTERED_EVENT, "business 1")

for(let i = 0; i < 10; i++) {
    businessRegistrationManager.emit(BusinessRegistrationManager.BUSINESS_REGISTERED_EVENT, `business ${i}`)
}
