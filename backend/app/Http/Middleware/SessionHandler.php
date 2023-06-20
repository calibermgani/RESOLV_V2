<?php

namespace App\Http\Middleware;

use App\Http\Controllers\DBConnectionController;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SessionHandler
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $db_id=$request->get('practice_dbid');
        Log::info($request->get('practice_dbid'));
        if($request->get('practice_dbid') != null)
        {
            $dbconnection = new DBConnectionController();
            $dbconnection->connectDB($db_id);
        }
        return $next($request);
    }
}
