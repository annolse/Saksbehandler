import { LightningElement, track, wire, api } from 'lwc';
import { getObjectInfo, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import APPLICATION_BASIS_CODE_OBJECT from '@salesforce/schema/ApplicationBasisCode__c';

export default class Aareg_applicationBasis extends LightningElement {
  @api record;
  @api organizationType;
  @track purposeOptions;
  @track legalBasisOptions;
  @track showOtherInput = false;
  purposeFieldName;
  legalBasisFieldName;
  applicationBasis;

  connectedCallback() {
    this.initApplicationBasis();
  }

  renderedCallback() {
    this.purpose = this.template.querySelector('[data-id="purpose"]');
    this.legalBasis = this.template.querySelector('[data-id="legal-basis"]');
    this.otherLegalBasis = this.template.querySelector('[data-id="other-legal-basis"]');
    this.otherPurpose = this.template.querySelector('[data-id="other-purpose"]');
    this.processingBasis = this.template.querySelector('[data-id="processing-basis"]');
  }

  initApplicationBasis() {
    this.applicationBasis = {
      uuid: this.record.uuid,
      OrganizationType__c: 'Municipality',
      LegalBasisMunicipality__c: null,
      PurposeMunicipality__c: null,
      LegalBasisCounty__c: null,
      PurposeCounty__c: null,
      LegalBasisState__c: null,
      PurposeState__c: null,
      LegalBasisElectricitySupervision__c: null,
      PurposeElectricitySupervision__c: null,
      LegalBasisPension__c: null,
      PurposePension__c: null,
      OtherLegalBasis__c: null,
      OtherPurpose__c: null,
      ProcessingBasis__c: null
    };
    this.publishChange();
  }

  @wire(getObjectInfo, { objectApiName: APPLICATION_BASIS_CODE_OBJECT })
  basisCodeInfo;

  @wire(getPicklistValuesByRecordType, {
    objectApiName: APPLICATION_BASIS_CODE_OBJECT,
    recordTypeId: '$basisCodeInfo.data.defaultRecordTypeId'
  })
  applicationBasisPicklists({ data, error }) {
    if (data) {
      switch (this.organizationType) {
        case 'Municipality':
          this.purposeFieldName = 'PurposeMunicipality__c';
          this.legalBasisFieldName = 'LegalBasisMunicipality__c';
          this.legalBasisOptions = data.picklistFieldValues.LegalBasisMunicipality__c.values;
          this.purposeData = data.picklistFieldValues.PurposeMunicipality__c;
          break;
        case 'County':
          this.purposeFieldName = 'PurposeCounty__c';
          this.legalBasisFieldName = 'LegalBasisCounty__c';
          this.legalBasisOptions = data.picklistFieldValues.LegalBasisCounty__c.values;
          this.purposeData = data.picklistFieldValues.PurposeCounty__c;
          break;
        case 'State':
          this.purposeFieldName = 'PurposeState__c';
          this.legalBasisFieldName = 'LegalBasisState__c';
          this.legalBasisOptions = data.picklistFieldValues.LegalBasisState__c.values;
          this.purposeData = data.picklistFieldValues.PurposeState__c;
          break;
        case 'Electricity Supervision':
          this.purposeFieldName = 'PurposeElectricitySupervision__c';
          this.legalBasisFieldName = 'LegalBasisElectricitySupervision__c';
          this.legalBasisOptions = data.picklistFieldValues.LegalBasisElectricitySupervision__c.values;
          this.purposeData = data.picklistFieldValues.PurposeElectricitySupervision__c;
          break;
        case 'Pension':
          this.purposeFieldName = 'PurposePension__c';
          this.legalBasisFieldName = 'LegalBasisPension__c';
          this.legalBasisOptions = data.picklistFieldValues.LegalBasisPension__c.values;
          this.purposeData = data.picklistFieldValues.PurposePension__c;
          break;
        default:
          break;
      }
    } else if (error) {
      console.log('Error!!!', error);
    }
  }

  /*************** Change handlers ***************/

  handleLegalBasisChange(event) {
    let key = this.purposeData.controllerValues[event.target.value];
    this.purposeOptions = this.purposeData.values.filter((opt) => opt.validFor.includes(key));
    this.applicationBasis[this.legalBasisFieldName] = event.target.value;
    this.applicationBasis[this.purposeFieldName] = '';
    if (event.target.value === 'Annet - oppgi i tekstfelt under') {
      this.showOtherInput = true;
    } else {
      this.showOtherInput = false;
    }
    this.publishChange();
  }

  handlePurposeChange(event) {
    this.applicationBasis[this.purposeFieldName] = event.target.value;
    this.publishChange();
  }

  handleInputChange(event) {
    switch (event.target.dataset.id) {
      case 'other-legal-basis':
        this.applicationBasis.OtherLegalBasis__c = event.target.value;
        break;
      case 'other-purpose':
        this.applicationBasis.OtherPurpose__c = event.target.value;
        break;
      case 'processing-basis':
        this.applicationBasis.ProcessingBasis__c = event.target.value;
        break;
      default:
        return;
    }
    this.publishChange();
  }

  publishChange() {
    const changeEvent = new CustomEvent('applicationbasischange', { detail: this.applicationBasis });
    this.dispatchEvent(changeEvent);
  }

  publishError() {
    const changeEvent = new CustomEvent('validationerror', { detail: true });
    this.dispatchEvent(changeEvent);
  }

  /*************** Validation ***************/

  @api
  validate() {
    console.log('validating basis');
    if (this.applicationBasis[`${this.purposeFieldName}`] === null || '') {
      this.setErrorFor(this.purpose, 'Obligatorisk');
    }
    if (this.applicationBasis[`${this.legalBasisFieldName}`] === null || '') {
      console.log('Missing legal basis');
      this.setErrorFor(this.legalBasis, 'Obligatorisk');
    }

    if (this.applicationBasis.ProcessingBasis__c === null || '') {
      console.log('Missing Processeing basis');
      this.setErrorFor(this.processingBasis, 'Obligatorisk');
    }

    if (
      this.applicationBasis[`${this.purposeFieldName}`] === 'Annet - oppgi i tekstfelt under' &&
      this.applicationBasis.OtherPurpose__c === null
    ) {
      console.log('Missing other purpose');
      this.setErrorFor(this.otherPurpose, 'Obligatorisk');
    }

    if (
      this.applicationBasis[`${this.legalBasisFieldName}`] === 'Annet - oppgi i tekstfelt under' &&
      this.applicationBasis.OtherLegalBasis__c === null
    ) {
      console.log('Missing other legal basis');
      this.setErrorFor(this.otherLegalBasis, 'Obligatorisk');
    }
  }

  setErrorFor(inputField, message) {
    this.publishError();
    let formControl = inputField.parentElement;
    let small = formControl.querySelector('small');
    small.innerText = message;
    formControl.className = 'form-control error';
  }
}
