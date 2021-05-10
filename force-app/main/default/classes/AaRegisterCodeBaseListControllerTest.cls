@isTest
public class AaRegisterCodeBaseListControllerTest {
@TestSetup
    static void createData(){
        Account acc = new Account();
        acc.Name = 'TestingAA-reg';
        insert acc;
        
		Id devRecordTypeId = SObjectType.Application__c.getRecordTypeInfosByDeveloperName().get('Aa_RegisterAccess').getRecordTypeId();    
        Application__c app = new Application__c();
        app.Account__c = acc.Id;
        app.RecordTypeId = devRecordTypeId;
        app.ApplicationSubmittedDate__c = system.now();
        insert app;
        
        ApplicationBasisCode__c abc = new ApplicationBasisCode__c();
        abc.Application__c = app.Id;
        abc.OrganizationType__c='County';
        abc.LegalBasisCounty__c='Aa-registerforskriften § 10 bokstav e';
        abc.PurposeCounty__c='Planleggingsarbeid - infrastruktur/kollektivtrasport/kartlegging av arbeidsreiser';
        abc.DecisionBasis__c = 'ja,da...';
        insert abc;
        
    }

@isTest
    static void testCodeBaseComponent(){
        Application__c appl =[SELECT id FROM Application__c LIMIT 1];
        List<ApplicationBasisCode__c> baseList =AaRegisterCodeBaseListController.getCodeBaseList(appl.Id);
    }
}