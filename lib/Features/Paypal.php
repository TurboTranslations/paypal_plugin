<?php
/**
 * Created by PhpStorm.
 * User: fregini
 * Date: 1/29/16
 * Time: 1:08 PM
 */

namespace Features;

use BasicFeatureStruct;
use controller;
use Features\Paypal\Controller\PreviewController;
use Features\Paypal\Utils\CDataHandler;
use Klein\Klein;

class Paypal extends BaseFeature {

    /**
     * @var CDataHandler
     */
    protected $jsonHandler;

    public function __construct( BasicFeatureStruct $feature ) {
        parent::__construct( $feature );
        $this->jsonHandler = new CDataHandler();
    }

    public static function loadRoutes( Klein $klein ) {
        $klein->respond( 'GET', '/preview',              [__CLASS__, 'previewRoute'] );
        route( '/reference-files/[:id_project]/[:password]/[:file_name_in_zip]', 'GET', 'Features\Paypal\Controller\API\ReferenceFilesController', 'flushStream' );
        route( '/preview/[:id_job]/[:password]', 'GET', 'Features\Paypal\Controller\API\PreviewsStruct', 'getPreviewsStruct'  );
    }

    public static function previewRoute($request, $response, $service, $app) {
        $controller    = new PreviewController( $request, $response, $service, $app);
        $template_path = dirname( __FILE__ ) . '/Paypal/View/Html/preview.html';
        $controller->setView( $template_path );
        $controller->respond();
    }

    /**
     * Ignore all glossaries. Temporary hack to avoid something unknown on MyMemory side.
     * We simply change the array_files key to avoid any glossary to be sent to MyMemory.
     *
     * TODO: glossary detection based on extension is brittle.
     *
     */
    public function filter_project_manager_array_files( $files, $projectStructure ) {
        $new_files = array() ;
        foreach ( $files as $file ) {
            if ( \FilesStorage::pathinfo_fix( $file, PATHINFO_EXTENSION ) != 'g' ) {
                $new_files[] = $file ;
            }
        }
        return $new_files   ;
    }

    public function handleJsonNotes( $projectStructure ){
        $this->jsonHandler->formatJson( $projectStructure );
    }

    /**
     * Tell to the controller to extract also json content of segment_notes table
     * @return bool
     */
    public function prepareAllNotes(){
        return true;
    }

    /**
     * @param $jsonStringNotes string
     *
     * @return mixed
     */
    public function processExtractedJsonNotes( $jsonStringNotes ){
        return $this->jsonHandler->parseJsonNotes( $jsonStringNotes );
    }

    public function processJobsCreated( $projectStructure ){
        $this->jsonHandler->storePreviewsMetadata( $projectStructure );
    }

    /**
     * Override the instance decision to convert or not the normal xlf/xliff files
     *
     * @param $forceXliff
     *
     * @return bool
     */
    public function forceXLIFFConversion( $forceXliff ){
        return false;
    }

    /**
     * Remove unwanted options from the UI and add additional filters
     *
     * @param $filter_args
     *
     * @return mixed
     */
    public function filterNewProjectInputFilters( $filter_args ){
        unset( $filter_args[ 'tag_projection' ] );
        $filter_args[ 'project_type' ] = [ 'filter' => FILTER_CALLBACK, 'options' => [ __CLASS__, 'sanitizeProjectTypeValue' ] ];
        return $filter_args;
    }

    /**
     * Callback for filters
     *
     * @param $fieldVal string
     *
     * @return string The sanitized field
     */
    public static function sanitizeProjectTypeValue( $fieldVal ) {

        $fieldVal = strtoupper( trim( filter_var( $fieldVal, FILTER_SANITIZE_STRING, [ 'flags' => FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH ] ) ) );

        $accepted_values = [ 'TR', 'LR', 'LQA' ];

        //if $fieldVal is not one of the accepted values, force it to "none"
        if ( !in_array( $fieldVal, $accepted_values ) ) {
            throw new \InvalidArgumentException( "Invalid project type $fieldVal", 400 );
        }

        return $fieldVal;

    }

    /**
     * Add options to project metadata
     *
     * @param $metadata
     * @param $__postInput
     *
     * @return mixed
     */
    public function filterProjectMetadata( $metadata, $__postInput ){
        $metadata[ 'project_type' ] = $__postInput[ 'project_type' ];
        return $metadata;
    }

    /**
     * Force a required authentication
     *
     * @param controller $controller
     */
    public function catControllerDoActionStart( controller $controller ){
        if( method_exists( $controller, 'setLoginRequired' ) ){
            /**
             * @var $controller \viewController
             */
            $controller->setLoginRequired( true ) ;
        }
    }

}