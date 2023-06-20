<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct()
  	{
    	$this->middleware('auth:api', ['except' => ['create_roles', 'update_roles']]);
  	}

  	public function create_roles(LoginRequest $request)
    {
    	$data=$request->get('form_data');
    	$up_id = $request->get('user_id');

    	$roles = new Role();
    	$roles->role_name = $data['roleName'];
    	$roles->status = $data['status'];
    	$roles->created_by = $up_id;
    	$roles->save();

    	return response()->json([
        	'data' => $roles, 'status' => 'Role created successfully'
        ]);
    }

    public function update_roles(LoginRequest $request)
    {
    	$data=$request->get('form_data');
    	$up_id = $request->get('user_id');
    	$role_id = $request->get('role_id');

    	$roles_id = Role::where('id', $role_id)->first();
    	$roles = Role::find($roles_id['id']);
    	$roles->role_name = $data['roleName'];
    	$roles->status = $data['status'];
    	$roles->created_by = $up_id;
    	$roles->save();

    	return response()->json([
        	'data' => $roles, 'status' => 'Role updated successfully'
        ]);
    }
}
