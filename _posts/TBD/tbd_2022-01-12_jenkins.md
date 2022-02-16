5


I am creating jenkins pipeline where I am defining agent stages and steps. In steps when I am using sh it throws error:

ERROR: Attempted to execute a step that requires a node context while ‘agent none’ was specified. Be sure to specify your own ‘node { ... }’ blocks when using ‘agent none’

Below is throwing the error:

pipeline {
    agent none
    stages {

        stage('Build2') {
            steps {
               sh 'echo "hello world" '
            }  
        }
    }
}
But when I use:

pipeline {
    agent none
    stages {

        stage('Build2') {
            steps {
               echo "hello world"
            }    
        }
    }
}
This works fine

I have used other commands using sh and getting same error.

I am not sure why invoking sh requires a node context.

jenkins-pipeline
Share
Edit
Follow
edited Jul 8 '19 at 15:48


Shwabster
48011 gold badge1212 silver badges2626 bronze badges
asked Jul 8 '19 at 15:36

amit sharma
6311 silver badge55 bronze badges
Add a comment
1 Answer

4

First of all echo step and sh step are very different.

Second of all why would you do agent none and then run something that would assume a particular OS on the executing machine?

One of the solutions would be using agent any.

Another thing, this is what jenkins documentation mentions about agent none:

When applied at the top-level of the pipeline block no global agent will be allocated for the entire Pipeline run and each stage section will need to contain its own agent section. For example: agent none



https://stackoverflow.com/questions/56938298/when-ever-i-invoke-shell-in-jenkins-pipeline-step-using-sh-it-gives-error-attemp


메시지 
ERROR: Attempted to execute a step that requires a node context while ‘agent none’ was specified.