<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Models\User_work_profile;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'getPermissions']]);
    }

    public function login(LoginRequest $request)
    {
        try {
            $credentials = $request->only('user_name', 'password');
            $token = Auth::attempt($credentials);
            if (!$token) {
                return response()->json([
                    'error' => 'invalid_credentials',
                ], 401);
            }

            $user = Auth::user();
            $role = ($user['user_type'] == 'Admin') ? "Admin" : "Practice";

            return response()->json([
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'bearer',
                'role' => $role,
                'expires_in' => JWTAuth::factory()->getTTL() * 60
            ]);
        } catch (Exception $e) {
            Log::debug("login Error :" . $e->getMessage());
        }
    }

    public function logout()
    {
        Auth::logout();
        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    public function refresh()
    {
        $user = Auth::user();

        return response()->json([
            'user' => $user,
            'access_token' => Auth::refresh(),
            'token_type' => 'bearer',
            // 'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'expires_in' => 300,
        ]);
    }

    public function me()
    {
        return response()->json(auth()->user());
    }

    public function getPermissions(LoginRequest $request)
    {
        try {
            $user_id = $request->get('id');

            $destinationPath = public_path('../config/permission.txt');
            $destinationPath2 = public_path('../config/edit_permission.txt');
            $jsondec = json_decode(file_get_contents($destinationPath), true);
            $jsondec_edit = json_decode(file_get_contents($destinationPath2), true);

            if ($request->get('user_role') == 'Admin') {
                $user = User::where('id', $user_id)->first();
            } else {
                $practice = $request->get('practice_id');
                $user = User_work_profile::where('user_id', $user_id)->where('practice_id', $practice)->first();
            }

            return response()->json([
                'permission' => $jsondec[$user['role_id']],
                'edit_permission' => $jsondec_edit[$user['role_id']]
            ]);
        } catch (Exception $e) {
            Log::debug('get Permission Error :' . $e->getMessage());
        }

    }
}
