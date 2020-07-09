const BaseUseCase = require('../BaseUseCase');
const HashControlFactory = require('../../core/hashControl/HashControlFactory');
const AuthControlFactory = require('../../core/authControl/AuthControlFactory');
const UserRepository =require('../../repositories/UserRepository')
var ObjectPath = require("object-path");
const HttpError = require('standard-http-error')

module.exports = class AuthenticateUseCase extends BaseUseCase {

    constructor(request, response, hashControl, authControl, userRepository) {
        super(request, response);
        this.hashControl = hashControl
        this.authControl = authControl
        this.userRepository = userRepository
    }


    validate() {

        try {

            let body = this.request.body
            let email = ObjectPath.get(body, "email")
            if (email == undefined) {
                throw new HttpError(400, "Email can not be empty");
            }

            let password = ObjectPath.get(body, "password")
            if (password == undefined) {
                throw new HttpError(400, "Password can not be empty");
            }

        } catch (error) {
            throw error;

        }
    }

    async execute() {
        try {
            this.validate()
            const body = this.request.body
            const { email, password } = body;
            let user
            let token
            if (email) {
                user = await this.userRepository.findOneBySelectingPassword({ email: email.toLowerCase()})
            }    
            if (user === null) {
                throw new HttpError(401, "user not found");
            }
            // await this.authorize([Role.Admin, Role.Tenant, Role.ProductManager, Role.ProductOwner], user)

            // if (user.role == Role.Tenant && user.productManagement.status == TenantStatus.Invited) {
            //     throw new HttpError(401, "Please accept the invitation sent over email")
            // }

            // if (user.role == Role.Tenant && user.productManagement.status == TenantStatus.Blocked) {
            //     throw new HttpError(401, "Your account is currently blocked, \n Please Contact Administrator")
            // }

            // if (user.role == Role.Tenant && user.productManagement.status == TenantStatus.Registered) {
            //     throw new HttpError(401, "Please check your email to complete your registration")
            // }

            // if (user.role == Role.ProductManager && user.productManagement.status == ProductManagerStatus.Invited) {
            //     throw new HttpError(401, "Please accept the invitation sent over email")
            // }

            // if (user.role == Role.ProductManager && user.productManagement.status == ProductManagerStatus.Blocked) {
            //     throw new HttpError(401, "Your account is currently blocked, \n Please Contact Administrator")
            // }

            // if (user.role == Role.ProductManager && user.productManagement.status == ProductManagerStatus.Registered) {
            //     throw new HttpError(401, "Please check your email to complete your registration")
            // }
            // if (user.role == Role.ProductOwner && user.productManagement.status == ProductOwnerStatus.Invited){
            //     throw new HttpError(401, "Please accept the invitation sent over email")
            // }
                
            // if (user.role == Role.ProductOwner && user.productManagement.status == ProductOwnerStatus.Blocked){
            //     throw new HttpError(401, "Your account is currently blocked, \n Please Contact Administrator")
            // }
                
            // if (user.role == Role.ProductOwner && user.productManagement.status == ProductOwnerStatus.Registered){
            //     throw new HttpError(401, "Please check your email to complete your registration")
            // }

            let isPasswordMatched = await this.hashControl.compare(body.password, user.password)
            if (!isPasswordMatched) {
                throw new HttpError(400, "Wrong password")
            }
            if(true){
                token = this.authControl.sign({ id: user._id,email: user.email}, 'wallet_secret', { expiresIn: "1d" })
            }else{
                token = this.authControl.sign({ id: user._id, tenantId: tenant._id.toString(), email: user.email, organizationName: user.organizationName ? user.organizationName : user.tenant, role: user.role }, process.env.kJWTSecret, { expiresIn: "1d" })
            }
            user.loginToken = token
            user.isLoggedIn = true
            user.save()
            user = user.toObject()
            return {
                message: 'Success',
                user
            }
        } catch (error) {
            console.log(error,'err');
            
            throw error
        }

    }

    static create(request, response) {

        let hashControlFactory = new HashControlFactory()
        let hashControl = hashControlFactory.create()
        let authControlFactory = new AuthControlFactory()
        let authControl = authControlFactory.create()

        let useCase = new AuthenticateUseCase(request, response, hashControl, authControl, new UserRepository())
        return useCase;

    }
}