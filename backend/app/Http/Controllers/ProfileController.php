<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Address_flag;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ProfileController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['getprofile', 'setimage', 'updateprofile']]);
    }

    //Get Profie Details

    public function getprofile(LoginRequest $request)
    {
        $id = $request->get('id');
        $user = User::where('id', $id)->first();
        $profile = Profile::where('user_id', $id)->first();
        $address = Address_flag::where('id', $profile['address_flag_id'])->first();

        $date_format[0] = (int)date('d', strtotime($profile['dob']));
        $date_format[1] = (int)date('m', strtotime($profile['dob']));
        $date_format[2] = (int)date('Y', strtotime($profile['dob']));

        //    $date= date('m-d-Y',strtotime($prof['dob']));

        $profile['dob'] = $date_format;


        //   $profile['dob']=$dob;

        if ($profile['image'] != null) {
            $imageName = $profile['image'];
            $path = "../storage/images/";
            $image = base64_encode(File::get(storage_path($path) . '/' . $imageName));
        } else {
            $image = '';
        }




        /*
       $this->validate($request, [
            'token' => 'required'
        ]);

        $user = JWTAuth::authenticate($request->token);

        return response()->json(['user' => $user]);*/
        /*$id =auth()->user());*/

        /*
        try {*/

        /*  $roles = DB::table('roles')->get();
        */
        /*   return view('listpetani', ['petani' => $petani]);
        */

        /* $factory = JWTFactory::customClaims([
                    'sub'   => $roles,
                ]);

                $payload = $factory->make();

                $token = JWTAuth::encode($payload);*/

        return response()->json([
            'user' => $user,
            'profile' => $profile,
            'address' => $address,
            'image' => $image
        ]);
        // Must Activate the JWT once the Issue is Sorted.-**-*-*--
        /*$payload = JWTFactory::make($roles);
$token = JWTAuth::encode($payload);*/

        /*    if (! $token = JWTAuth::authenticate( $roles )) {
                return response()->json(['error' => 'invalid_credentials','token' => $token], 401);
            }
        } catch (JWTException $e) {

        }*/
        /*
        return $this->respondWithToken2($roles);*/
    }


    //Image Upload
    public function setimage(LoginRequest $request)
    {
        $image = $request->get('image');
        $image2 = $image;
        $id = $request->get('id');
        if (strpos($image2, '/jpeg') !== false) {
            $image = str_replace('data:image/jpeg;base64,', '', $image);
            $extn = 'jpeg';
        } elseif (strpos($image2, '/jpg') !== false) {
            $image = str_replace('data:image/jpg;base64,', '', $image);
            $extn = 'jpg';
        } elseif (strpos($image2, '/png') !== false) {
            $image = str_replace('data:image/png;base64,', '', $image);
            $extn = 'png';
        }
        /* $image = str_replace('data:image/jpeg;base64,', '', $image);*/
        $image = str_replace(' ', '+', $image);
        $imageName = $id . '.' . $extn;

        $path = "../storage/images/";


        DB::table('profiles')->where('user_id', $id)->update(array(
            'image'         => $imageName,
            'updated_by'         => $id,
            'updated_at'          => now()
        ));


        File::put(storage_path($path) . '/' . $imageName, base64_decode($image));


        return response()->json([
            'data' => $image2
        ]);
    }

    //Profile Update
    public function updateprofile(LoginRequest $request)
    {
        $id = $request->get('id');
        $data = $request->get('data');
        $user = DB::table('users')->where('id', $id)->update(array(
            'firstname'         => $data['firstname'],
            'lastname'          => $data['lastname']
        ));


        $dob = date('Y-m-d', strtotime($data['dob']['day'] . '-' . $data['dob']['month'] . '-' . $data['dob']['year']));

        $profile = DB::table('profiles')->where('user_id', $id)->update(array(
            'mobile_phone'         => $data['phone'],
            'dob'                  => $dob
        ));


        $profile = Profile::where('user_id', $id)->first();
        DB::table('address_flags')->where('id', $profile['address_flag_id'])->update(array(
            'address_line_1'       => $data['address1'],
            'address_line_2'       => $data['address2'],
            'city'                 => $data['city'],
            'state'                => $data['state'],
            'zip5'                 => $data['zip'],
            'zip4'                 => $data['zip']
        ));

        return response()->json([
            'data' => $dob
        ]);
    }
}
