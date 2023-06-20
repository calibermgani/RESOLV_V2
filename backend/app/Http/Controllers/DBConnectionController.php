<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Practice;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Nwidart\DbExporter\Exceptions\InvalidDatabaseException;

class DBConnectionController extends Controller
{
    public $admin_db = '';

    public function __construct()
    {
        $this->admin_db = env('DB_DATABASE');
        set_time_limit(300);
    }

    public function createSchema($schemaName)
    {
        // \Log::info("Create schema called" . $schemaName . "##" . $this->admin_db);
        try {
            $tenantDB = $schemaName;
            $adminDB = ($this->admin_db != '') ? $this->admin_db : config('siteconfigs.connection_database');  //env('DB_DATABASE');
            if ($adminDB == '') {
                Log::info("Database name empty error occured");
                throw new Exception("Error Processing Request", 1);
            }

            $query = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME =  ?";
            $db = DB::select($query, [$tenantDB]);
            if (empty($db)) {
                DB::connection()->statement("CREATE DATABASE " . $tenantDB);
                Log::info("Db not exists. Create DB called");

                try {
                    $this->configurebyName($tenantDB);
                    // define('STDIN', fopen("php://stdin", "r"));
                    Artisan::call('migrate', array('--database' => $tenantDB, '--path' => 'database/migrations', '--force' => true));

                    Artisan::call('db:seed');
                } catch (Exception $e) {
                    DB::connection()->statement("DROP DATABASE " . $tenantDB);
                    Log::info("Error on seed, error: " . $e->getMessage() . " Drop database called " . $tenantDB);
                    $admin_database = $this->admin_db; // env('DB_DATABASE');
                    Log::info("configure into admin database: " . $admin_database);
                    $this->configurebyName($adminDB);

                    throw new Exception("Error Processing Request. Please try again later (or) contact site admin!!!", 1);
                }
            } else {
                $errMSg = 'Database already exists! Please contact site admin!!!';
                Log::info("Database already exist exception occured.");
                throw new Exception($errMSg);
            }
        } catch (InvalidDatabaseException $e) {
            Log::info("Invalid database exception occured. Error: " . $e->getMessage());
            throw new Exception("Error Processing Request. Please try again later (or) contact site admin!!!", 1);
        } catch (Exception $e) {
            Log::info("Error: " . $e->getMessage());
            throw new Exception("Error Processing Request. Please try again later (or) contact site admin!!!", 1);
        }
        return true;
    }


    public function configurebyName($tenantName)
    {


        // Just get access to the config.
        $config = App::make('config');

        // Will contain the array of connections that appear in our database config file.
        $connections = $config->get('database.connections');

        // This line pulls out the default connection by key (by default it's `mysql`)
        $defaultConnection = $connections[$config->get('database.default')];

        // Now we simply copy the default connection information to our new connection.
        $newConnection = $defaultConnection;
        // Override the database name.
        $newConnection['database'] = $tenantName;

        // This will add our new connection to the run-time configuration for the duration of the request.
        App::make('config')->set('database.connections.' . $tenantName, $newConnection);
    }



    public function configureConnectionByName($tenantName)
    {


        $practice_data = Practice::where('id', $tenantName)->first();

        $tenantName = $practice_data['practice_db_id'];



        // Just get access to the config.
        Artisan::call('config:clear');
        $config = App::make('config');

        // Will contain the array of connections that appear in our database config file.
        $connections = $config->get('database.connections');

        // This line pulls out the default connection by key (by default it's `mysql`)
        $defaultConnection = $connections[$config->get('database.default')];

        // Now we simply copy the default connection information to our new connection.
        $newConnection = $defaultConnection;
        // Override the database name.
        $newConnection['database'] = $tenantName;

        // This will add our new connection to the run-time configuration for the duration of the request.
        App::make('config')->set('database.connections.' . $tenantName, $newConnection);
    }

    public function connectDB($practice_id)
    {
        Config::set('database.default', 'mysql2');

        $practice_data = Practice::where('id', $practice_id)->first();

        if(isset($practice_data)){
            Artisan::call('config:clear');
            $config = App::make('config');

            $connections = $config->get('database.connections');
            // $defaultConnection = $connections[$config->get('database.default')];
            $defaultConnection = $connections['mysql'];

            $newConnection = $defaultConnection;
            $newConnection['database'] = 'developertest'; //$practice_data['practice_db_id'];

            App::make('config')->set('database.connections.' . 'mysql', $newConnection);

            DB::connection('mysql')->reconnect();
            Config::set('database.default', 'mysql');
            // Log::info("Default :" . DB::connection()->getDatabaseName());


            $connections = DB::connection()->getDatabaseName();
            // Log::info("Here DB " . $connections);
            // $connections = $config->get('database.connections');

        }
    }


    public function disconnectPracticeDB()
    {
        DB::reconnect();
    }
}
