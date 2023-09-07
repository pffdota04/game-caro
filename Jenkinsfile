def AGENT_LABEL	     // use for seleting NODE
def TAG_VERSION	     // use TAG_VERSION if the tag name is available

if (BRANCH_NAME == "prod") {
    echo "Service in branch PROD can not build. Please build service with tag."
    currentBuild.result = 'SUCCESS'
    return
} else {
    try {
        TAG_VERSION = TAG_NAME    // for PROD build
    }
    catch (error) {
        AGENT_LABEL = "AWS_EC2_SMALL"
    }
}

if ( TAG_VERSION != null ) {
    AGENT_LABEL = "AWS_EC2_LARGE"
} else {
    AGENT_LABEL = "AWS_EC2_SMALL"
}

pipeline {
    agent {
        node {
            label AGENT_LABEL
        }
    }
    options {
        disableConcurrentBuilds()   // Disable multitask build
        buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '5', numToKeepStr: '5'))
        skipStagesAfterUnstable()
        office365ConnectorWebhooks([
            [name: "jenkins", url: "${O365_URL_WEBHOOK}", notifyBackToNormal: true, notifyFailure: true, notifyRepeatedFailure: true, notifySuccess: true, notifyAborted: true]
        ])
    }
    environment {
        APP_NAME = "game-channel-service"   // must input application name
        VERSION = "v${env.BUILD_NUMBER}"
        GITHASH = "${sh(script: 'git rev-parse HEAD | head -c 8', returnStdout: true).trim()}"
        REPLICAS = "1"
        REPOSITORY_NAME = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${APP_NAME}"
        ENVIRONMENT_DEPLOY = "${ TAG_VERSION == null ? "${env.BRANCH_NAME}" : "prod" }"
        FILE_DEPLOYMENT =  "deploy-eks/${ENVIRONMENT_DEPLOY}/$APP_NAME/values.yaml"
        REPOSITORY_NAME_TAG = "${ ENVIRONMENT_DEPLOY == "prod" ? "${TAG_VERSION}_${ENVIRONMENT_DEPLOY}_${env.BUILD_NUMBER}" : "${VERSION}${GITHASH}_${env.BRANCH_NAME}"}"
        AWS_CLUSTER_NAME = "${ENVIRONMENT_DEPLOY}-ekscluster"
    }
    stages {
        stage('Pre-Build') {
            steps {
                script {
                    echo 'Building..'
                    echo 'install dependencies and tools'
                    try {
                        sh'''
                        sudo tar -xf /opt/${HELM_CHART}/*.tgz
                        helm package --app-version "$REPOSITORY_NAME_TAG" ${HELM_CHART}
                        sudo rm -rf ${HELM_CHART}
                        '''
                    }
                    catch (error) {
                    }
                    dir('deploy-eks'){
                        if (BRANCH_NAME == "test" || BRANCH_NAME == "stg") {
                            REPODEPLOY = "$REPODEPLOY_DEV_URL"
                        } else {
                            REPODEPLOY = "$REPODEPLOY_URL"
                        }
                        try {
                            git branch: "$REPODEPLOY_BRANCH",
                            credentialsId: "$REPODEPLOY_CREDGIT",
                            url: "$REPODEPLOY",
                            changelog: false
                        }
                        catch (error) {
                        }
                    }
                }
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Build') {
            steps {
                script {
                    sh '''
                    aws ecr describe-repositories --repository-names ${APP_NAME} --query "repositories[].[repositoryName]" --output text --no-cli-pager || aws ecr create-repository --repository-name ${APP_NAME} --image-scanning-configuration scanOnPush=true --query "repositories[].[repositoryName]" --output text --no-cli-pager
                    docker build -t "$APP_NAME":"$REPOSITORY_NAME_TAG" .
                    docker tag "$APP_NAME":"$REPOSITORY_NAME_TAG" "$REPOSITORY_NAME":"$REPOSITORY_NAME_TAG"
                    aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
                    docker push "$REPOSITORY_NAME":"$REPOSITORY_NAME_TAG"
                    docker rmi "$REPOSITORY_NAME":"$REPOSITORY_NAME_TAG"
                    docker rmi "$APP_NAME":"$REPOSITORY_NAME_TAG"
                    '''
                }
            }
        }
		stage('Deploy') {
            steps {
                script{
                    if ( ENVIRONMENT_DEPLOY != "prod" ) {
                        sh 'sed -i -e "s|envs|$ENVIRONMENT_DEPLOY|g" -e "s|repositoryName|$REPOSITORY_NAME|g" -e "s|repositoryTag|"$REPOSITORY_NAME_TAG"|g" -e "s|replicas|"$REPLICAS"|g" $FILE_DEPLOYMENT'
                        if (ENVIRONMENT_DEPLOY == "test" ) {
                            sh 'aws eks --region ${AWS_DEFAULT_REGION} update-kubeconfig --name ${AWS_CLUSTER_NAME} --kubeconfig $KUBE_DEFAULT_CONFIG_PATH$ENVIRONMENT_DEPLOY'
                        } else {
                            sh 'aws eks --region ${AWS_DEFAULT_REGION} update-kubeconfig --name ${AWS_CLUSTER_NAME} --profile ${IAMROLE_STGEKSACCESS} --kubeconfig $KUBE_DEFAULT_CONFIG_PATH$ENVIRONMENT_DEPLOY'
                        }
                        sh '''
                            helm upgrade --install $APP_NAME ${HELM_CHART}*.tgz -f "$FILE_DEPLOYMENT" --namespace "$ENVIRONMENT_DEPLOY" --kubeconfig $KUBE_DEFAULT_CONFIG_PATH$ENVIRONMENT_DEPLOY
                        '''
                    } else {
                        sh 'echo "Service in Production environment cannot automation deploy. Please manual deploy."'
                        def userInput = input(id: 'userInput', message: 'Do you want to deploy to Production?', submitter: 'admin', parameters:[choice(choices: ['Yes', 'No'], description: 'Please select an option below', name: 'User Input')])
                        if (userInput == 'Yes') {
                            echo "You selected '${userInput}' in the Input Request step"
                            sh'''
                                sed -i -e "s|envs|"$ENVIRONMENT_DEPLOY"|g" -e "s|repositoryName|$REPOSITORY_NAME|g" -e "s|repositoryTag|"$REPOSITORY_NAME_TAG"|g" -e "s|replicas|"$REPLICAS"|g" $FILE_DEPLOYMENT
                                aws eks --region ${AWS_DEFAULT_REGION} update-kubeconfig --name ${AWS_CLUSTER_NAME} --kubeconfig $KUBE_DEFAULT_CONFIG_PATH$ENVIRONMENT_DEPLOY
                                helm upgrade --install $APP_NAME ${HELM_CHART}*.tgz -f "$FILE_DEPLOYMENT" --namespace "$ENVIRONMENT_DEPLOY" --kubeconfig $KUBE_DEFAULT_CONFIG_PATH$ENVIRONMENT_DEPLOY
                            '''
                        }
                        else {
                            echo "You selected '${userInput}' in the Input Request step"
                            sh 'echo "The service was built but not deploy to Production."'
                        }
                    }
                }
            }
        }
    }
}
