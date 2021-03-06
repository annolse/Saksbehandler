import { LightningElement, track, wire, api } from 'lwc';
import Id from '@salesforce/user/Id';
import processApplication from '@salesforce/apex/AAREG_ApplicationController.processApplication';
import getLastUsedOrganizationInformation from '@salesforce/apex/AAREG_ApplicationController.getLastUsedOrganizationInformation';
import getAccountNameByOrgNumber from '@salesforce/apex/AAREG_ApplicationController.getAccountNameByOrgNumber';

export default class Aareg_application extends LightningElement {
  @track contactRows;
  @track applicationBasisRows;
  @track application;
  @track organization;
  error;
  @api hasErrors;
  organizationType;
  applicationSubmitted = false;
  currentUser = Id;

  @wire(getLastUsedOrganizationInformation, { userId: '$currentUser' })
  wiredOrganizationInformation({ error, data }) {
    if (data) {
      this.organization = data;
      this.organizationType = data.AAREG_OrganizationCategory__c;
      this.error = undefined;
      this.initializeNewApplication();
    } else if (error) {
      this.error = error;
      this.organizations = undefined;
    }
  }

  initializeNewApplication() {
    this.application = {
      Account__c: this.organization.Id,
      OrganizationNumber__c: this.organization.INT_OrganizationNumber__c,
      OrganizationStructure__c: this.organization.INT_OrganizationalStructure__c,
      MailingAddress__c: this.organization.ShippingStreet,
      MailingCity__c: this.organization.ShippingCity,
      MailingPostalCode__c: this.organization.ShippingPostalCode,
      Email__c: null,
      DataProcessor__c: null,
      APIAccess__c: false,
      ExtractionAccess__c: false,
      OnlineAccess__c: false,
      DataProcessorOrganizationNumber__c: null,
      organizationName: this.organization.Name
    };

    this.contactRows = [{ uuid: this.createUUID() }];
    this.applicationBasisRows = [{ uuid: this.createUUID() }];
  }

  /*************** Dynamic Element handlers ***************/

  createUUID() {
    let dt = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
  }

  removeContactRow(event) {
    if (this.contactRows.length > 1) {
      this.contactRows.splice(event.target.value, 1);
    }
  }

  addContactRow() {
    this.contactRows.push({ uuid: this.createUUID() });
  }

  removeApplicationBasisRow(event) {
    if (this.applicationBasisRows.length > 1) {
      this.applicationBasisRows.splice(event.target.value, 1);
    }
  }

  addApplicationBasisRow() {
    this.applicationBasisRows.push({ uuid: this.createUUID() });
  }

  /****************************************************************************************/

  handleSubmit() {
    this.hasErrors = false;
    this.validateApplicationBasis();
    this.validateContactsBeforeSubmission();
    this.checkApplicationInputs();
    if (this.hasErrors) {
      console.log('Has Errors did not submit!!');
      return;
    }
    processApplication({
      application: this.application,
      basisCode: this.applicationBasisRows,
      relatedContacts: this.contactRows
    })
      .then((response) => {
        this.applicationSubmitted = true;
        console.log(response);
      })
      .catch((error) => {
        console.log(JSON.stringify(error));
      });
  }

  /*************** Change handlers ***************/

  contactChange(event) {
    let changedContact = event.detail;
    let foundIndex = this.contactRows.findIndex((element) => element.uuid === changedContact.uuid);
    if (typeof foundIndex !== 'undefined') {
      this.contactRows[foundIndex] = changedContact;
    }
  }

  applicationBasisChange(event) {
    let changes = event.detail;
    let foundIndex = this.applicationBasisRows.findIndex((element) => element.uuid === changes.uuid);
    if (typeof foundIndex !== 'undefined') {
      this.applicationBasisRows[foundIndex] = changes;
    }
  }

  handleDataProcessorChange(event) {
    let dataProcessor = event.target.value;
    if (dataProcessor.length === 9) {
      getAccountNameByOrgNumber({ orgNumber: dataProcessor })
        .then((result) => {
          this.application.DataProcessor__c = result;
          this.application.DataProcessorOrganizationNumber__c = dataProcessor;
        })
        .catch((error) => {
          this.application.DataProcessor__c = null;
          this.application.DataProcessorOrganizationNumber__c = null;
          this.error = error;
          console.log(error);
        });
    } else if (this.application.DataProcessor__c != null) {
      this.application.DataProcessor__c = null;
      this.application.DataProcessorOrganizationNumber__c = null;
    }
  }

  handleApplicationInputChange(event) {
    let isChecked = (fieldName) => {
      if (fieldName) {
        return false;
      } else {
        return true;
      }
    };

    switch (event.target.dataset.id) {
      case 'email':
        this.application.Email__c = event.target.value;
        break;
      case 'api-access':
        this.application.APIAccess__c = isChecked(this.application.APIAccess__c);
        break;
      case 'online-access':
        this.application.OnlineAccess__c = isChecked(this.application.OnlineAccess__c);
        break;
      case 'extraction-access':
        this.application.ExtractionAccess__c = isChecked(this.application.ExtractionAccess__c);
        break;
      default:
        return;
    }
  }

  /*************** Validation ***************/

  processError(event) {
    console.log('Error Received');
    if (event.detail) {
      this.hasErrors = true;
    }
  }

  validateApplicationBasis() {
    let purposes = this.template.querySelectorAll('c-aareg_application-basis');
    purposes.forEach((purpose) => {
      purpose.validate();
    });
  }

  validateContactsBeforeSubmission() {
    let agreementNotification = 0;
    let changeNofiication = 0;
    let errorNotification = 0;
    let securityNotification = 0;
    console.log(this.contactRows.length);

    let cons = this.template.querySelectorAll('c-aareg_application-contact');

    cons.forEach((con) => {
      con.validate();
    });

    this.contactRows.forEach((contact) => {
      if (contact.AgreementNotifications__c !== false) {
        agreementNotification += 1;
      }

      if (contact.ChangeNotifications__c !== false) {
        changeNofiication += 1;
      }

      if (contact.ErrorMessageNotifications__c !== false) {
        errorNotification += 1;
      }

      if (contact.SecurityNotifications__c !== false) {
        securityNotification += 1;
      }
    });
    if (agreementNotification < 1 || changeNofiication < 1 || errorNotification < 1 || securityNotification < 1) {
      this.setErrorFor(this.contacts, 'Varslinger er obligatorisk.');
    }
  }

  renderedCallback() {
    this.email = this.template.querySelector('[data-id="email"]');
    this.contacts = this.template.querySelector('[data-id="contacts"]');
    this.apiAccess = this.template.querySelector('[data-id="api-access"]');
    this.onlineAccess = this.template.querySelector('[data-id="online-access"]');
    this.extractionAccess = this.template.querySelector('[data-id="extraction-access"]');
    this.accessTypes = this.template.querySelector('[data-id="access-types"]');
  }

  checkApplicationInputs() {
    if (this.application.Email__c === null || '') {
      this.setErrorFor(this.email, 'E-post er obligatorisk.');
    }
    if (
      this.application.APIAccess__c === false &&
      this.application.ExtractionAccess__c === false &&
      this.application.OnlineAccess__c === false
    ) {
      this.setErrorFor(this.accessTypes, 'Minst ??n type tilgang er obligatorisk');
    }
  }

  setErrorFor(inputField, message) {
    this.hasErrors = true;
    let formControl = inputField.parentElement;
    let small = formControl.querySelector('small');
    small.innerText = message;
    formControl.className = 'form-control error';
  }
}
