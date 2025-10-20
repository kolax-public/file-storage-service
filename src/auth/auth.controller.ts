import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: 'Initiate Google OAuth login', 
    description: 'This endpoint initiates the Google OAuth flow. It should be accessed directly in a browser to trigger the redirect to Google for authentication.' 
  })
  async googleAuth(@Req() req) {
    // redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleAuthRedirect(@Req() req) {
    const jwt = await this.authService.login(req.user);
    return { access_token: jwt.access_token }; 
  }
}