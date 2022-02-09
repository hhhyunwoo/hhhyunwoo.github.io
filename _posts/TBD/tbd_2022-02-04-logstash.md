logstash 로 mysql 연결해서 하는 중에

하고 싶었던 것은

하나의 config로 하나의 쿼리만 날릴수 밖ㅇ ㅔ없나???

여러개의 쿼리 날리려면 어떻게 함?
그리고 같은 인덱스에다가 집어넣으면 구분 어떻게 함??

이게 나의 궁금증이었다./

-> 해결
일단 첫번째
logstash 에서 필드 추가하기

```SH
input {

    http {

    }

 }

  filter {
     mutate {
        add_field => { "test_string" => "Python version 1" }
     }
   }

output {
    stdout {
  #     codec => {rubydebug}
    }
    elasticsearch {

      hosts=> ["localhost:9200"]
      index => "so-test1"
    }
}
```

두번째
여러개의 쿼리 보내기

```SH
input {
  jdbc {
    jdbc_driver_library => "/Users/logstash/mysql-connector-java-5.1.39-bin.jar"
    jdbc_driver_class => "com.mysql.jdbc.Driver"
    jdbc_connection_string => "jdbc:mysql://localhost:3306/database_name"
    jdbc_user => "root"
    jdbc_password => "password"
    schedule => "* * * * *"
    statement => "select * from table1"
    type => "table1"
  }
  jdbc {
    jdbc_driver_library => "/Users/logstash/mysql-connector-java-5.1.39-bin.jar"
    jdbc_driver_class => "com.mysql.jdbc.Driver"
    jdbc_connection_string => "jdbc:mysql://localhost:3306/database_name"
    jdbc_user => "root"
    jdbc_password => "password"
    schedule => "* * * * *"
    statement => "select * from table2"
    type => "table2"
  }
  # add more jdbc inputs to suit your needs
}
output {
    elasticsearch {
        index => "testdb"
        document_type => "%{type}"   # <- use the type from each input
        hosts => "localhost:9200"
    }
}
```

요거는 근데 여러개의 테이블을 조회할 때 사용하면 좋을 것 같다

근데 내가 꺠달은건 mysql 쿼리로 카운트를 여러개 할 수 있다는 사실이었다..!

```SQL
SELECT COUNT(1) AS TOTAL,
COUNT(CASE WHEN userid is null and domain is null THEN 1 END) AS AVAILABLE,
COUNT(CASE WHEN userid is not null and domain is not null THEN 1 END) AS UNAVAILABLE
FROM hosts;
```

https://stackoverflow.com/questions/59664500/how-to-add-a-field-to-kibana-via-logstash
https://stackoverflow.com/questions/37613611/multiple-inputs-on-logstash-jdbc
https://java119.tistory.com/36
